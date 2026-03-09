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

# TODO: specjalizacje

class ProgramsParser():
    
    def __init__(self, module_dir, plans_dir, majors_filename, output):
        
        self.module_dir = module_dir
        self.plans_dir = os.path.join(module_dir, plans_dir)
        self.majors_filename = os.path.join(module_dir, majors_filename)
        self.output_filename = os.path.join(module_dir, output)
        self.get_details = False
        
        self.main_url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true"
        
        self.logger = logging.getLogger(__name__)
        if not self.logger.handlers:
            logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
        
        
    
    def get_majors_list(self):
        """
        Fetches the list of majors from programy.p.lodz.pl and saves it to .csv file
        """
        
        self.logger.info(f"Pobieranie listy kierunków z {self.main_url}")
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
            
            self.logger.info("Lista kierunków zapisana pomyślnie.")
        except Exception as e:
            self.logger.error(f"Błąd podczas pobierania listy kierunków: {e}")
        
    def get_majors_all_versions(self, major, url, soup=None):
        """ From file created by get_majors_list() creates directory with:
        - every major having separate file
        - every file contains all years/versions of major's plan

        Args:
            major (str): major name
            url (str): major's site url
            soup (_type_, optional): _description_. Defaults to None.
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
            self.logger.error(f"Błąd podczas pobierania planów dla {major}: {e}")
                    
    def get_plans_from_courses(self, start=0, end=-1):
        if not os.path.exists(self.majors_filename):
            self.logger.error("Plik kierunków nie istnieje!")
            return

        with open(self.majors_filename, newline='', encoding='utf-8') as csvfile:
            rows = list(csv.reader(csvfile))[1:]
            selected_rows = rows[start:end] if end >= start else rows[start:]

            for row in selected_rows:
                self.get_majors_all_versions(row[0], row[1])
                
    def get_plans_from_faculties(self, faculties):
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
                        self.logger.info(f"Przetwarzanie kierunku: {row[0]}")
                        self.get_majors_all_versions(row[0], row[1], soup=soup)
                except Exception as e:
                    self.logger.warning(f"Pominięto {row[0]} z powodu błędu: {e}")
                    
    def parse_major(self, url, faculty, specialty_name=None):

        try:
            response = requests.get(url, timeout=15)
            response.encoding = 'utf-8'
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logging.error(f"Nie udało się pobrać strony głównej: {e}")
            return None

        soup_page = BeautifulSoup(response.text, "html.parser")

        # 1. DANE KIERUNKU
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
            logging.warning(f"Błąd podczas parsowania parametrów URL: {e}")
            kierunek = {"semestry": [], "nazwa": "Błąd", "od": "Błąd"}

        # 2. ROK
        header = soup_page.find("h1")
        if header:
            for word in header.text.split():
                if "/" in word:
                    kierunek["od"] = word

        # 3. SEMESTRY
        semester_tables = soup_page.find_all("div", class_="iform")
        if not semester_tables:
            logging.warning("Nie znaleziono żadnych tabel z semestrami (klasa .iform)")

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

            # 4. PRZEDMIOTY
            tbody = table.find("tbody")
            if not tbody:
                continue

            for row in tbody.find_all("tr"):
                items = row.find_all("td")
                if not items:
                    continue
                
                przedmiot = {header: item.text.strip() for header, item in zip(headers, items)}

                # 5. OPCJONALNE WEJŚCIE GŁĘBIEJ
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
                            logging.error(f"Błąd przy karcie przedmiotu {przedmiot.get('Kod przedmiotu', '???')}: {e}")

                semestr["przedmioty"].append(przedmiot)

            kierunek["semestry"].append(semestr)

        logging.info(f"Zakończono parsowanie: {kierunek['nazwa']} ({kierunek['od']}) ({"stac." if kierunek['stacjonarne'] else "nstac."})")
        return kierunek
    
    def get_majors_specialties(self, url):
        try:
            response = requests.get(url, timeout=15)
            response.encoding = 'utf-8'
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            logging.error(f"Nie udało się pobrać strony głównej: {e}")
            return None

        soup_page = BeautifulSoup(response.text, "html.parser")
        opts = soup_page.find("select").find_all("option")
        
        if not opts:
            return None
        else:
            return {opt.get('value'): opt.text.strip() for opt in opts}
        
    def parse_link(self, url: str) -> str:
        return url.replace(" ", "%20", -1)
    
    def parse_programs_to_json(self):
        self.logger.info("Generowanie końcowego pliku JSON...")
        kierunki = []
        if not os.path.exists(self.plans_dir):
            self.logger.warning("Folder planów nie istnieje.")
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
        self.logger.info(f"Zapisano dane do {self.output_filename}")

    def clean(self):
        self.logger.info("Sprzątanie plików tymczasowych...")
        try:
            if os.path.exists(self.plans_dir):
                shutil.rmtree(self.plans_dir)
            if os.path.exists(self.majors_filename):
                os.remove(self.majors_filename)
        except Exception as e:
            self.logger.warning(f"Nie udało się w pełni posprzątać: {e}")

    def get_programs(self, faculties=None, clean=True, get_details=False):
        self.get_majors_list()
        self.get_details = get_details
        
        if faculties is None or "all" in faculties:
            self.get_plans_from_courses()
        else:
            self.get_plans_from_faculties(faculties)
        
        self.parse_programs_to_json()
        
        if clean:
            self.clean()
