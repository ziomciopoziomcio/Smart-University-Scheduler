import requests
from urllib.parse import urljoin
import csv
from bs4 import BeautifulSoup
import re
import os
import json
import logging
from urllib.parse import urlparse, parse_qs
import shutil

class ProgramsParser():
    
    def __init__(self, module_dir: str, plans_dir: str, majors_filename: str, output: str):
        
        self.module_dir = module_dir
        self.plans_dir = os.path.join(module_dir, plans_dir)
        self.majors_filename = os.path.join(module_dir, majors_filename)
        self.output_filename = os.path.join(module_dir, output)
        self.get_details = False
        
        self.main_url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true"
        
        self.logger = logging.getLogger(__name__)
        if not self.logger.handlers:
            logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
        
        
    
    def get_majors_list(self) -> None:
        """
        Fetches the list of majors from programy.p.lodz.pl and saves it to .csv file
        """
        
        self.logger.info(f"Fetching the list of study programs from {self.main_url}")
        try:
            response = requests.get(self.main_url, timeout=15)
            response.encoding = 'utf-8'
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            os.makedirs(os.path.dirname(self.majors_filename), exist_ok=True)
            
            with open(self.majors_filename, "w", newline="", encoding="utf-8") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(["Kierunek", "Link"])

                lists = soup.find_all("ul")
                for ul in lists[1:]: 
                    a_tag = ul.find("a")
                    if not a_tag: continue

                    name = a_tag.get_text(strip=True).replace('.', "")
                    link = urljoin(self.main_url, a_tag["href"])
                    writer.writerow([name, link])
            
            self.logger.info("The list of programs was saved successfully.")
        except Exception as e:
            self.logger.error(f"Error while fetching the list of programs: {e}")
        
    def get_majors_all_versions(self, major: str, url: str, soup=None) -> None:
        """ From file created by get_majors_list() creates directory with:
        - every major having separate file
        - every file contains all years/versions of major's plan

        Args:
            major (str): major name
            url (str): major's site url
        """
        
        os.makedirs(self.plans_dir, exist_ok=True)
        safe_major = "".join([c for c in major if c.isalnum() or c in (' ', '-', '_')]).strip()
        destination = os.path.join(self.plans_dir, f"{safe_major}.csv")

        try:
            if not soup:
                response = requests.get(url, timeout=15)
                response.encoding = 'utf-8'
                soup = BeautifulSoup(response.text, "html.parser")

            pre_tag = soup.find("pre")
            wydzial = pre_tag.text.replace("\r", " ").strip() if pre_tag else "Nieznany Wydział"

            with open(destination, "w", newline="", encoding="utf-8") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(["Nazwa", "Wydzial", "Stopien", "Stacjonarne", "Link"])

                for a_tag in soup.find_all("a", onclick=True):
                    name = a_tag.get_text(strip=True)
                    match = re.search(r"window\.open\('([^']+)'", a_tag["onclick"])
                    if match:
                        full_link = urljoin(url, match.group(1))
                        stacjonarne = 'studia stacjonarne' in full_link
                        stopien = 1 if 'studia pierwszego stopnia' in full_link else 2
                        writer.writerow([name, wydzial, stopien, stacjonarne, full_link])
        except Exception as e:
            self.logger.error(f"Error while fetching schedules for {major}: {e}")
                    
    def get_plans_from_courses(self, start=0, end=-1) -> None:
        """ Fetches plans from all listed courses.

        Args:
            start (int, optional): Start index. Defaults to 0.
            end (int, optional): End index. Defaults to -1.
        """
        if not os.path.exists(self.majors_filename):
            self.logger.error("The file with programs does not exist!")
            return

        with open(self.majors_filename, newline='', encoding='utf-8') as csvfile:
            rows = list(csv.reader(csvfile))[1:]
            selected_rows = rows[start:end] if end >= start else rows[start:]

            for row in selected_rows:
                self.get_majors_all_versions(row[0], row[1])
                
    def get_plans_from_faculties(self, faculties: list[str]) -> None:
        """ Fetches plans from given faculties

        Args:
            faculties (list): list of faculties' names
        """
        if not os.path.exists(self.majors_filename): return

        with open(self.majors_filename, newline='', encoding='utf-8') as csvfile:
            rows = list(csv.reader(csvfile))[1:]
            session = requests.Session()

            for row in rows:
                try:
                    resp = session.get(row[1], timeout=10)
                    resp.encoding = 'utf-8'
                    soup = BeautifulSoup(resp.text, "html.parser")
                    pre = soup.find("pre")
                    wydzial = pre.text.replace("\r", " ").strip() if pre else ""

                    if any(f in wydzial for f in faculties):
                        self.logger.info(f"Processing major: {row[0]}")
                        self.get_majors_all_versions(row[0], row[1], soup=soup)
                except Exception as e:
                    self.logger.warning(f"Skipped {row[0]} due to an error: {e}")
                    
    def parse_major(self, url: str, faculty: str, specialty_name: str = None) -> dict:
        """
        Parses a single major into a dictionary

        Args:
            url (str): URL to major's site.
            faculty (str): Name of faculty.
            specialty_name (str, optional): Name of specialty. Defaults to None.

        Returns:
            dict: description of a single major in form of a dictionary
        """

        try:
            response = requests.get(url, timeout=15)
            response.encoding = 'utf-8'
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to fetch the main page: {e}")
            return None

        soup_page = BeautifulSoup(response.text, "html.parser")

        # 1. MAJOR DATA
        try:
            parsed_url = urlparse(url)
            args_dict = parse_qs(parsed_url.query)

            kierunek = {
                "nazwa": args_dict.get("w", ["Nieznany"])[0],
                "wydzial": faculty,
                "stopien": 1 if "studia pierwszego stopnia" in args_dict.get("stopien", [""])[0] else 2,
                "stacjonarne": "studia stacjonarne" in args_dict.get("tryb", [""])[0],
                "specjalizacja": specialty_name,
                "semestry": [],
                "od": "Nieznany"
            }
        except Exception as e:
            logging.warning(f"Error while parsing URL parameters: {e}")
            kierunek = {"semestry": [], "nazwa": "Błąd", "od": "Błąd"}

        # 2. YEAR
        header = soup_page.find("h1")
        if header:
            for word in header.text.split():
                if "/" in word:
                    kierunek["od"] = word

        # 3. SEMESTERS
        semester_tables = soup_page.find_all("div", class_="iform")
        if not semester_tables:
            logging.warning("No tables with semesters found (class .iform)")

        for table in semester_tables:
            sem_header = table.find("h3")
            if not sem_header:
                continue

            thead = table.find("thead")
            if not thead:
                continue
            headers = [header.text.strip() for header in thead.find_all("th")]

            semestr = {
                "nazwa": sem_header.text.strip(),
                "przedmioty": []
            }

            # 4. SUBJECTS
            tbody = table.find("tbody")
            if not tbody:
                continue

            for row in tbody.find_all("tr"):
                items = row.find_all("td")
                if not items:
                    continue
                
                przedmiot = {header: item.text.strip() for header, item in zip(headers, items)}

                # 5. OPTIONAL GETTING DETAILS
                if self.get_details:
                    link_tag = items[0].find("a")
                    if link_tag and link_tag.has_attr('onclick'):
                        try:

                            js_click = link_tag['onclick']
                            path = js_click.split("'")[1]
                            link = "https://programy.p.lodz.pl/ectslabel-web/" + path
                            
                            resp_card = requests.get(link, timeout=10)
                            resp_card.raise_for_status()
                            karta = BeautifulSoup(resp_card.text, "html.parser")

                            detale = {}
                            for tr in karta.find_all('tr'):
                                param = tr.find('td', class_='parametr')
                                val = tr.find('td', class_='wartosc')
                                if param and val:
                                    detale[param.get_text(strip=True)] = val.get_text(" ", strip=True)

                            realizatorzy_raw = detale.get("Realizatorzy przedmiotu", "")
                            realizatorzy = [r.strip() for r in realizatorzy_raw.split(',') if r.strip()]

                            przedmiot.update({
                                "jednostka": detale.get("Jednostka prowadząca", "Brak danych"),
                                "kierownik": detale.get("Kierownik przedmiotu", "Brak danych"),
                                "realizatorzy": realizatorzy
                            })
                        except Exception as e:
                            logging.error(f"Error in course page {przedmiot.get('Course Code', '???')}: {e}")

                semestr["przedmioty"].append(przedmiot)

            kierunek["semestry"].append(semestr)

        logging.info(f"Finished parsing: {kierunek['name']} ({kierunek['from']}) ({'full-time' if kierunek['stacjonarne'] else 'part-time'})")
        return kierunek
    
    def get_majors_specialties(self, url: str) -> dict:
        """
        Fetches all specialties from a given major's URL into a dict.

        Args:
            url (str): URL to major's site

        Returns:
            dict: list of all specialties of a major. {"id" : "name"}
        """
        
        try:
            response = requests.get(url, timeout=15)
            response.encoding = 'utf-8'
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to fetch the main page: {e}")
            return None

        soup_page = BeautifulSoup(response.text, "html.parser")
        opts = soup_page.find("select").find_all("option")
        
        if not opts:
            return None
        else:
            return {opt.get('value'): opt.text.strip() for opt in opts}
        
    def parse_link(self, url: str) -> str:
        """
        Helper func. Fills white chars with "%20".

        Args:
            url (str): URL to fill

        Returns:
            str: Filled URL
        """
        return url.replace(" ", "%20", -1)
    
    def parse_programs_to_json(self) -> None:
        """
        From the list of majors fetches the details using get_majors_specialties() and parse_major(). Then saves to JSON file.
        """
        self.logger.info("Generating final JSON file...")
        kierunki = []
        if not os.path.exists(self.plans_dir):
            self.logger.warning("Plans folder does not exist.")
            return

        for e in os.scandir(self.plans_dir):
            if e.is_file() and e.name.endswith(".csv"):
                with open(e.path, "r", encoding="utf-8") as f:
                    plans = list(csv.reader(f))[1:]
                    for p in plans:
                        
                        # p[4] link, p[1] wydzial
                        spec_dict = self.get_majors_specialties(p[4])
                        
                        if not spec_dict:
                            data = self.parse_major(self.parse_link(p[4]), p[1])
                            if data: kierunki.append(data)
                        else:
                            for spec_id, spec_name in spec_dict.items():
                                data = self.parse_major(self.parse_link(f"{p[4]}&sp={spec_id}"), p[1], specialty_name=spec_name)
                                if data: kierunki.append(data)
                            
                        
                            
        with open(self.output_filename, "w", encoding="utf-8") as f:
            json.dump(kierunki, f, ensure_ascii=False, indent=4)
        self.logger.info(f"Data saved to {self.output_filename}")

    def clean(self) -> None:
        """
        Deletes the temporary files generated in the process of fetching the data.
        """
        self.logger.info("Cleaning up temporary files...")
        try:
            if os.path.exists(self.plans_dir):
                shutil.rmtree(self.plans_dir)
            if os.path.exists(self.majors_filename):
                os.remove(self.majors_filename)
        except Exception as e:
            self.logger.warning(f"Failed to fully clean up: {e}")

    def get_programs(self, faculties: list[str] = None, clean: bool = True, get_details: bool = False) -> None:
        """
        Main function. Using sub-funcs set with given parameters fetches all the necessary data into a single JSON file. 

        Args:
            faculties (list[str], optional): List of faculties' names, from which the data is fetched. Defaults to None. If None or ["all"] - fetches all data without considering faculties.
            clean (bool, optional): If the temp files should be deleted after fetching. Defaults to True.
            get_details (bool, optional): If should fetch details about majors (requires requesting additional subpages - might take longer). Defaults to False.
        """
        
        self.get_majors_list()
        self.get_details = get_details
        
        if faculties is None or "all" in faculties:
            self.get_plans_from_courses()
        else:
            self.get_plans_from_faculties(faculties)
        
        self.parse_programs_to_json()
        
        if clean:
            self.clean()
