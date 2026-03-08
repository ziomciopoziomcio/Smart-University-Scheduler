import requests
from urllib.parse import urljoin
import csv
from bs4 import BeautifulSoup
import re
import os
import json
import logging
from urllib.parse import urlparse, parse_qs

# DEPRECATED
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# 1. do kierunki.csv liste kierunków
def parse_study_programmes_to_csv(filename, url):
    """
    Pobiera ze strony listę kierunków studiów oraz linki do ich podstron
    i zapisuje je do pliku CSV.

    Funkcja wysyła zapytanie HTTP do podanego adresu URL, parsuje kod HTML
    przy pomocy BeautifulSoup, następnie wyszukuje elementy zawierające
    nazwy kierunków i odpowiadające im linki. Wyniki zapisywane są w pliku CSV
    w dwóch kolumnach: "Kierunek" oraz "Link".

    Args:
        filename (str): Ścieżka do pliku CSV, w którym zostaną zapisane dane.
        url (str): Adres strony z listą kierunków (np. programy.p.lodz.pl).

    Returns:
        None
    """
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    with open(filename, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["Kierunek", "Link"])

        first = True
        for ul in soup.find_all("ul"):
            if first:
                first = False
                continue

            a_tag = ul.find("a")
            if not a_tag:
                continue

            name = a_tag.get_text(strip=True).replace('.', "")
            link = urljoin(url, a_tag["href"])

            writer.writerow([name, link])

# 2.1 z pojedynczego kierunku wszystkie wersje planów
# dest = "plany/"
# kierunek = "informatyka"
# url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true&s=programKsztalcenia&pk=informatyka.&v=4"
def scrape_study_plans_to_csv(dest, kierunek, url, soup=None):
    """
    Pobiera informacje o planach studiów ze strony kierunku i zapisuje je do pliku CSV.

    Funkcja analizuje stronę HTML danego kierunku, wyszukuje linki do planów studiów,
    a następnie zapisuje zebrane dane do pliku CSV.

    Nazwa pliku jest tworzona automatycznie na podstawie nazwy kierunku.

    Args:
        dest (str):
            Ścieżka do katalogu, w którym zostanie zapisany plik CSV.

        kierunek (str):
            Nazwa kierunku studiów. Zostanie użyta jako nazwa pliku
            oraz zapisana w kolumnie "Nazwa".

        url (str):
            Adres URL strony zawierającej plany studiów dla danego kierunku.

        soup (BeautifulSoup):
            Wstępnie sparsowany obiekt BeautifulSoup strony kierunku.
            Jeśli zostanie przekazany, funkcja użyje go zamiast ponownie
            pobierać stronę z internetu. Domyślnie None.

    Returns:
        None

    Zapisane kolumny CSV:
        - Nazwa – nazwa kierunku / planu
        - Wydzial – nazwa wydziału pobrana ze strony
        - Stopien – stopień studiów (1 lub 2)
        - Stacjonarne – True dla studiów stacjonarnych, False dla niestacjonarnych
        - Link – pełny URL do planu studiów
    """
    os.makedirs(dest, exist_ok=True)
    destination = f"{dest}{kierunek}.csv"

    if not soup:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, "html.parser")

    wydzial = soup.find("pre").text.replace("\r", " ")

    with open(destination, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["Nazwa", "Wydzial", "Stopien", "Stacjonarne", "Link"])

        for a_tag in soup.find_all("a", onclick=True):
            stacjonarne = None
            stopien = None

            name = a_tag.get_text(strip=True)
            onclick_value = a_tag["onclick"]

            match = re.search(r"window\.open\('([^']+)'", onclick_value)
            if match:
                relative_link = match.group(1)
                full_link = urljoin(url, relative_link)

                if 'studia stacjonarne' in full_link:
                    stacjonarne = True
                if 'studia niestacjonarne' in full_link:
                    stacjonarne = False

                if 'studia pierwszego stopnia' in full_link:
                    stopien = 1
                if 'studia drugiego stopnia' in full_link:
                    stopien = 2

                writer.writerow([name, wydzial, stopien, stacjonarne, full_link])


# 2.2.a z kierunki.csv wszystkie kierunki od indeksu start do end
# sourcefile = "kierunki.csv"
# dest = "plany/"
# scrape_study_plans_from_courses(sourcefile, dest, start=0, end=4)
def scrape_study_plans_from_courses(sourcefile, destination_dir, start=0, end=-1):
    """
    Odczytuje listę kierunków studiów z pliku CSV i dla każdego z nich
    pobiera plany studiów, zapisując je do osobnych plików CSV.

    Funkcja wykorzystuje `scrape_study_plans_to_csv()` do pobrania danych
    z każdej strony kierunku.

    Args:
        sourcefile (str):
            Ścieżka do pliku CSV zawierającego listę kierunków studiów.
            Oczekiwany format wiersza:
            [nazwa_kierunku, url_strony_kierunku]

        destination_dir (str):
            Katalog, w którym zostaną zapisane pliki CSV z planami studiów.

        start (int, optional):
            Indeks wiersza, od którego rozpocznie się przetwarzanie.
            Domyślnie 0.

        end (int, optional):
            Indeks wiersza kończącego zakres przetwarzania.
            Jeśli `end < start`, funkcja przetworzy wszystkie wiersze od `start`
            do końca pliku. Domyślnie -1.

    Returns:
        None
    """
    with open(sourcefile, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        header = next(reader, None)
        rows = list(reader)
        if end >= start:
            selected_rows = rows[start:end]
        else:
            selected_rows = rows[start:]

        for row in selected_rows:
            kierunek = row[0].strip()
            url = row[1].strip()

            scrape_study_plans_to_csv(f"{destination_dir}/", kierunek, url)


# 2.2.b z kierunki.csv wszystkie kierunki z danego wydziału do csv w \plany
# sourcefile = "kierunki.csv"
# dest = "plany/"
# wydzial = ["Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki"]
def scrape_study_plans_from_faculties(sourcefile, destination_dir, faculties):
    """
    Pobiera plany studiów tylko dla kierunków należących do wybranych wydziałów.

    Funkcja odczytuje listę kierunków studiów z pliku CSV, następnie dla każdego
    kierunku pobiera jego stronę internetową, sprawdza nazwę wydziału i jeśli
    znajduje się ona na liście `faculties`, zapisuje plany studiów do osobnego
    pliku CSV przy użyciu funkcji `scrape_study_plans_to_csv()`.

    Args:
        sourcefile (str):
            Ścieżka do pliku CSV zawierającego listę kierunków studiów.

        destination_dir (str):
            Katalog, w którym zostaną zapisane pliki CSV z planami studiów.

        faculties (list[str]):
            Lista nazw wydziałów. Tylko kierunki należące do tych wydziałów
            zostaną przetworzone i zapisane.

    Returns:
        None
    """

    with open(sourcefile, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        header = next(reader, None)
        rows = list(reader)

        session = requests.Session()

        for row in rows:
            kierunek = row[0].strip()
            url = row[1].strip()

            response = session.get(url)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, "html.parser")
            wydzial = soup.find("pre").text.replace("\r", " ")

            if wydzial in faculties:
                scrape_study_plans_to_csv(f"{destination_dir}/", kierunek, url, soup=soup)


# 3.1 url z kartami przedmiotu z danego kierunku przerabia na słownik
def parse_subject(url, wydzial, zajrzyj_glebiej=False):

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
        
        specjalizacja = args_dict.get("sp", [None])[0]
        if specjalizacja:
            try:
                specjalizacja = int(specjalizacja)
            except ValueError:
                pass

        kierunek = {
            "nazwa": args_dict.get("w", ["Nieznany"])[0],
            "wydzial": wydzial,
            "stopien": 1 if "studia pierwszego stopnia" in args_dict.get("stopien", [""])[0] else 2,
            "stacjonarne": "studia stacjonarne" in args_dict.get("tryb", [""])[0],
            "specjalizacja": specjalizacja,
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
            if zajrzyj_glebiej:
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

    logging.info(f"Zakończono parsowanie: {kierunek['nazwa']} ({kierunek['od']})")
    return kierunek

# 3.2 z \plany do json
def parse_karty_przedmiotow_to_json(plany_dir, output_file_dir):
    
    kierunki = []
    
    for e in os.scandir(plany_dir):
        if e.is_file() and e.name.endswith(".csv"):
            with open(e.path, "r", encoding="utf-8") as f:
                plans = csv.reader(f)
                next(plans, None)
                for p in plans:
                    
                    kierunki.append(parse_subject(parse_link(p[4]), p[1], zajrzyj_glebiej=False))
                    print(f"Dodano {p[0]}.")
                    
                    
    with open(output_file_dir, "w", encoding="utf-8") as f:
        json.dump(kierunki, f)

def parse_link(url: str) -> str:
    return url.replace(" ", "%20", -1)

if __name__ == "__main__":
    
    module_dir = "helpers\\data_collector\\"
    plany_dir = module_dir + "plany\\"
    pipeline_filename_kierunki = module_dir + "kierunki.csv"
    
    main_url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true"
    
    wydzialy = ["Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki"]
    
    output_file_dir = module_dir + "programy.json"
    
    # PIPELINE
    # 1.
    parse_study_programmes_to_csv(pipeline_filename_kierunki, main_url)
    
    # 2.
    os.mkdir(plany_dir)
    scrape_study_plans_from_faculties(pipeline_filename_kierunki, plany_dir, wydzialy)
    
    # 3.
    parse_karty_przedmiotow_to_json(plany_dir, output_file_dir)
           
    # CLEAR

    # for e in os.scandir(plany_dir):
    #     if e.is_file():
    #         os.remove(e)
    # os.rmdir(module_dir + "plany")
    # os.remove(module_dir + "kierunki.csv")