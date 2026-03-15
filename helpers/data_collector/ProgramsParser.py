import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import csv
from bs4 import BeautifulSoup
import re
import os
import json
import logging
from urllib.parse import urlparse, parse_qs, urljoin
import shutil
from time import sleep

class ProgramsParser():
    
    def __init__(self, module_dir: str, plans_dir: str, majors_filename: str, output: str, missed_filename:str = "missed.csv"):
        
        self.module_dir = module_dir
        self.plans_dir = os.path.join(module_dir, plans_dir)
        self.majors_filename = os.path.join(module_dir, majors_filename)
        self.output_filename = os.path.join(module_dir, output)
        self.get_details = False
        self.session = None
        self.missed_filename = os.path.join(module_dir, missed_filename)
        
        self.main_url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true"
        
        self.headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        }
        retry_strategy = Retry(
                                    total=10,
                                    backoff_factor=2,
                                    status_forcelist=[500, 502, 503, 504]
                                )
        
        self.adapter = HTTPAdapter(max_retries=retry_strategy)
        
        
        self.logger = logging.getLogger(__name__)
        if not self.logger.handlers:
            logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
        
        
    
    def get_majors_list(self) -> None:
        """
        Fetches the list of majors from programy.p.lodz.pl and saves it to .csv file
        """
        
        self.logger.info(f"Fetching the list of study programs from {self.main_url}")
        try:
            response = self.session.get(self.main_url, timeout=15)
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
                response = self.session.get(url, timeout=15)
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
            
            for row in rows:
                try:
                    resp = self.session.get(row[1], timeout=10)
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
        """Parses a single major's webpage and extracts its curriculum into a dictionary."""

        try:
            response = self.session.get(url, timeout=15)
            response.encoding = 'utf-8'
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to fetch the main page: {e}")
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
                "od": "Nieznany",
                "url": url
            }
        except Exception as e:
            self.logger.warning(f"Error while parsing URL parameters: {e}")
            kierunek = {"semestry": [], "nazwa": "Błąd", "od": "Błąd"}


        # 2. YEAR
        header = soup_page.find("h1")
        if header:
            for word in header.text.split():
                if "/" in word:
                    kierunek["od"] = word

        self.logger.info(f"Trying to parse: ({kierunek["stopien"] * "I"} st.) {kierunek['nazwa']} { f"- {specialty_name}" if specialty_name else ""} ({kierunek['od']}) ({"stac." if kierunek['stacjonarne'] else "nstac."})")

        # 3. SEMESTERS
        semester_tables = soup_page.find_all("div", class_="iform")
        if not semester_tables:
            self.logger.warning("No tables with semesters found (class .iform)")

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
                            
                            resp_card = self.session.get(link, timeout=10)
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
                                "realizatorzy": realizatorzy,
                                "jezyk": detale.get("Język prowadzenia zajęć", "Brak danych")
                            })
                        except Exception as e:
                            self.logger.error(f"Error in course page {przedmiot.get('Kod przedmiotu', '???')}: {e}")
                            
                            file_exists = os.path.isfile(self.missed_filename)
                            with open(self.missed_filename, "a", newline="", encoding="utf-8") as m_file:
                                m_writer = csv.writer(m_file)
                                if not file_exists:
                                    m_writer.writerow(["nazwa_kierunku", "wydzial", "stopien", "specjalizacja", "od", "nazwa_semestru", "link_do_przedmiotu", "kod_przedmiotu"])
                                
                                m_writer.writerow([
                                    kierunek["nazwa"],
                                    kierunek["wydzial"],
                                    kierunek["stopien"],
                                    kierunek["specjalizacja"],
                                    kierunek["od"],
                                    semestr["nazwa"],
                                    przedmiot["Kod przedmiotu"]
                                    
                                ])

                semestr["przedmioty"].append(przedmiot)

            kierunek["semestry"].append(semestr)

        self.logger.info(
            f"Finished parsing: ({kierunek["stopien"] * "I"} st.) {kierunek['nazwa']} { f"- {specialty_name}" if specialty_name else ""} ({kierunek['od']}) ({"stac." if kierunek['stacjonarne'] else "nstac."})")
        return kierunek
    
    def get_majors_specialties(self, url: str) -> dict:
        """Fetches all specialties available for a major from its page."""
        
        try:
            response = self.session.get(url, timeout=15)
            response.encoding = 'utf-8'
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to fetch the main page: {e}")
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
        """Iterates through all CSV plan files and compiles the curricula into a JSON file."""
        
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

                        spec_dict = self.get_majors_specialties(p[4])
                        if self.time_between_fos_sec > 0: self.pretty_wait(self.time_between_fos_sec)
                        
                        if not spec_dict:
                            data = self.parse_major(self.parse_link(p[4]), p[1])
                            if data: kierunki.append(data)
                        else:
                            for spec_id, spec_name in spec_dict.items():
                                data = self.parse_major(self.parse_link(f"{p[4]}&sp={spec_id}"), p[1], specialty_name=spec_name)
                                if data: kierunki.append(data)
                               
        
        if self.overwrite: self.save_to_json(data=kierunki, filename=self.output_filename, label="Preliminary")
        
    def clean(self) -> None:
        """Removes temporary files and directories created during scraping."""
        
        self.logger.info("Cleaning up temporary files...")
        try:
            if os.path.exists(self.plans_dir):
                shutil.rmtree(self.plans_dir)
            if os.path.exists(self.majors_filename):
                os.remove(self.majors_filename)
        except Exception as e:
            self.logger.warning(f"Failed to fully clean up: {e}")

    def get_programs(self, faculties: list[str] = None, clean: bool = True, get_details: bool = False, overwrite: bool = True, time_between_fos_sec: int = 0) -> None:
        """Main method that orchestrates the entire scraping process and saves data to a JSON file."""
        
        if time_between_fos_sec < 0:
            self.logger.fatal("Incorrect function args!")
            return 
        
        self.overwrite = overwrite
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.session.mount("https://", self.adapter)
        self.time_between_fos_sec = time_between_fos_sec
        self.get_majors_list()
        self.get_details = get_details
        
        if faculties is None or "all" in faculties:
            self.get_plans_from_courses()
        else:
            self.get_plans_from_faculties(faculties)
        
        self.parse_programs_to_json()
        self.retry_missed_subjects()
        self.raport_and_clean_programs()
        
        
        if clean:
            self.clean()

    def pretty_wait(self, time_sec, bars=10):
        """Displays a simple progress bar while waiting to avoid rate-limiting."""
        
        interval = time_sec // bars
        self.logger.info(f"Waiting {time_sec}s to avoid detection...")
        for _ in range(bars):
            sleep(interval)
            print("|", end='', flush=True)
        print()
        
    def save_to_json(self , data, filename, label):
        """Saves data to a JSON file with utf-8 encoding."""
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        self.logger.info(f"{label} data saved to {filename}")
        
    def retry_missed_subjects(self) -> None:
        """Retries fetching details for subjects that failed during the initial run."""
        
        if not os.path.exists(self.missed_filename):
            self.logger.info("No missed.csv file found. Nothing to retry.")
            return

        if not os.path.exists(self.output_filename):
            self.logger.error(f"Main output file {self.output_filename} not found!")
            return

        with open(self.output_filename, "r", encoding="utf-8") as f:
            kierunki = json.load(f)

        still_missed = []
        
        with open(self.missed_filename, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)

        if not rows: return

        self.logger.info(f"Retrying fetching {len(rows)} missed subjects...")

        for row in rows:
            link = row['link_do_przedmiotu']
            success = False
            
            try:
                resp_card = self.session.get(link, timeout=15)
                resp_card.raise_for_status()
                karta = BeautifulSoup(resp_card.text, "html.parser")

                detale = {}
                for tr in karta.find_all('tr'):
                    param = tr.find('td', class_='parametr')
                    val = tr.find('td', class_='wartosc')
                    if param and val:
                        detale[param.get_text(strip=True)] = val.get_text(" ", strip=True)

                new_data = {
                    "jednostka": detale.get("Jednostka prowadząca", "Brak danych"),
                    "kierownik": detale.get("Kierownik przedmiotu", "Brak danych"),
                    "realizatorzy": [r.strip() for r in detale.get("Realizatorzy przedmiotu", "").split(',') if r.strip()],
                    "jezyk": detale.get("Język prowadzenia zajęć", "Brak danych")
                }

                for k in kierunki:
                    if (k['nazwa'] == row['nazwa_kierunku'] and 
                        k['wydzial'] == row['wydzial'] and 
                        str(k['stopien']) == str(row['stopien']) and 
                        str(k['specjalizacja']) == str(row['specjalizacja']) and 
                        k['od'] == row['od']):
                        
                        for sem in k['semestry']:
                            if sem['nazwa'] == row['nazwa_semestru']:
                                for przedmiot in sem['przedmioty']:
                                    if przedmiot["Kod przedmiotu"] == row["kod_przedmiotu"]:
                                         przedmiot.update(new_data)
                                         success = True
                
                if success:
                    self.logger.info(f"Successfully recovered subject from: {link}")
                else:
                    self.logger.warning(f"Fetched data but couldn't find matching entry in JSON for: {link}")
                    still_missed.append(row)

            except Exception as e:
                self.logger.error(f"Retry failed for {link}: {e}")
                still_missed.append(row)

        self.save_to_json(data=kierunki, filename=self.output_filename, label="Filled-in")

        if not still_missed:
            os.remove(self.missed_filename)
            self.logger.info("All missed subjects recovered. missed.csv removed.")
        else:
            with open(self.missed_filename, "w", newline="", encoding="utf-8") as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(still_missed)
            self.logger.info(f"Retry finished. {len(still_missed)} subjects still missing.")
            
    def raport_and_clean_programs(self):
        """Cleans empty majors from the dataset and outputs final statistics."""
        
        self.logger.info("Reporting and cleaning empty programs...")
        
        if not os.path.exists(self.output_filename):
            self.logger.error("Output file not found for reporting.")
            return

        try:
            with open(self.output_filename, "r", encoding='utf-8') as f: 
                fields_of_study = json.load(f)
        except json.JSONDecodeError:
            self.logger.error("Failed to decode JSON. File might be corrupted.")
            return

        def get_stats(data_list):
            m = len(data_list)
            s = sum(len(fos.get("semestry", [])) for fos in data_list)
            sub = sum(len(sem.get("przedmioty", [])) for fos in data_list for sem in fos.get("semestry", []))
            return m, s, sub

        m_pre, s_pre, sub_pre = get_stats(fields_of_study)
        self.logger.info(f"BEFORE: {m_pre} Majors, {s_pre} Semesters, {sub_pre} Subjects")

        cleaned_fos = [fos for fos in fields_of_study if any(len(s.get("przedmioty", [])) > 0 for s in fos.get("semestry", []))]
        
        removed_fos = [[fos.get("nazwa"), fos.get("url")] for fos in fields_of_study if fos not in cleaned_fos]

        if removed_fos:
            removed_path = os.path.join(self.module_dir, "removed_empty_programs.csv")
            with open(removed_path, "w", newline="", encoding="utf-8") as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(["Nazwa Kierunku", "Link"])
                writer.writerows(removed_fos)

        m_post, s_post, sub_post = get_stats(cleaned_fos)
        self.logger.info(f"AFTER: {m_post} Majors, {s_post} Semesters, {sub_post} Subjects")
        
        dir_name = os.path.dirname(self.output_filename)
        base_name = os.path.basename(self.output_filename)
        final_path = os.path.join(dir_name, f"final-{base_name}")
        
        self.save_to_json(data=cleaned_fos, filename=final_path, label="Final")