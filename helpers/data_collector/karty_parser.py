import requests
from urllib.parse import urljoin
import csv
from bs4 import BeautifulSoup
import re
import os
import json

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
            soup = BeautifulSoup(response.text, "html.parser")
            wydzial = soup.find("pre").text.replace("\r", " ")

            if wydzial in faculties:
                scrape_study_plans_to_csv(f"{destination_dir}/", kierunek, url, soup=soup)


# 3.1 url z kartami przedmiotu z danego kierunku przerabia na słownik
def parse_subject(url, wydzial, zajrzyj_glebiej=False):
    """
    Parsuje siatkę studiów kierunku z portalu ECTS Label Politechniki Łódzkiej (programy.p.lodz.pl).

    Funkcja pobiera dane o semestrach i przedmiotach, a opcjonalnie wchodzi w 
    szczegóły każdego przedmiotu (karta przedmiotu), aby wyciągnąć informacje 
    o prowadzących i jednostce organizacyjnej.

    Args:
        url (str): Pełny adres URL do strony siatki przedmiotów (kierunekSiatkaV4.jsp).
        wydzial (str): Nazwa wydziału prowadzącego kierunek (np. "WEEIA").
        zajrzyj_glebiej (bool, optional): Jeśli True, skrypt wyśle dodatkowe zapytanie 
            HTTP dla każdego przedmiotu, aby pobrać szczegółowe dane z jego karty. 
            Defaults to False.

    Returns:
        dict: Słownik zawierający metadane kierunku, listę semestrów oraz 
            szczegółowe wykazy przedmiotów wraz z ich atrybutami.
    """
    
    response = requests.get(url) 
    soup_page = BeautifulSoup(response.text, "html.parser")

    # INFORMACJE OGÓLNE O KIERUNKU
    args = url.split("&")[1:]
    args_dict = {arg.split("=")[0]: arg.split("=")[1] for arg in args}
    
    specjalizacja = None
    try:
        specjalizacja = int(args_dict["sp"])
    except:
        pass
    
    kierunek = {
        "nazwa" : args_dict["w"],
        "wydzial" : wydzial,
        "stopien" : 1 if args_dict["stopien"] == "studia%20pierwszego%20stopnia" else 2,
        "stacjonarne" : args_dict["tryb"] == "studia%20stacjonarne",
        "specjalizacja": specjalizacja,
        "semestry": []
    }
    
    main_header_words = soup_page.find("h1").text.split()
    for word in main_header_words:
        if "/" in word:
            kierunek["od"] = word


    # SEMESTRY
    semester_tables = soup_page.find_all("div", class_="iform")   

            
    for table in semester_tables:
        sem = table.find("h3")
        if not sem:
            break

        headers_raw = table.find("thead").find_all("th")
        headers = [header.text.strip() for header in headers_raw]
        
        semestr = {
            "nazwa": sem.text.strip(),
            "przedmioty": []
        }
        
        # PRZEDMIOTY
        for row in table.find("tbody").find_all("tr"):
            items = row.find_all("td")
            
            przedmiot = {header: item.text.strip() for header, item in zip(headers, items)}
                
            # SZUKA JEDNOSTKI PROWADZACEJ I PROWADZACYCH
            if zajrzyj_glebiej:
                
                link_tag = items[0].find("a")
                
                if link_tag and link_tag.has_attr('onclick'):
                    
                    try:
                        link = "https://programy.p.lodz.pl/ectslabel-web/" + link_tag['onclick'].split("'")[1]
                        response_card = requests.get(link, timeout=10) 
                        karta = BeautifulSoup(response_card.text, "html.parser")

                        detale = {
                            tr.find('td', class_='parametr').get_text(strip=True): 
                            tr.find('td', class_='wartosc').get_text(" ", strip=True)
                            for tr in karta.find_all('tr') 
                            if tr.find('td', class_='parametr') and tr.find('td', class_='wartosc')
                        }
                        
                        realizatorzy = [r.strip() for r in detale.get("Realizatorzy przedmiotu", "").split(',')]
                        
                        przedmiot.update({
                            "jednostka": detale.get("Jednostka prowadząca", ""),
                            "kierownik": detale.get("Kierownik przedmiotu", ""),
                            "realizatorzy": realizatorzy
                        })
                        
                    except Exception as e:
                        print(f"Błąd przy karcie {przedmiot.get('Kod przedmiotu')}: {e}") 
                
            semestr["przedmioty"].append(przedmiot)
            
        
        kierunek["semestry"].append(semestr)
    
    print(f"Zakończono parsowanie dla kierunku: {kierunek['nazwa']} z {kierunek["od"]}")
    return kierunek

# 3.2 z \plany do json
def parse_karty_przedmiotow_to_json(plany_dir, output_file_dir):
    
    kierunki = []
    
    for e in os.scandir(plany_dir):
        if e.is_file():
            with open(e.path, "r") as f:
                plans = csv.reader(f)
                next(plans, None)
                for p in plans:
                    
                    # print(p)
                    kierunki.append(parse_subject(p[4], p[1], True))
                    print(f"Dodano {p[0]}.")
                    
                    
    with open(output_file_dir, "w", encoding="utf-8") as f:
        json.dump(kierunki, f)


if __name__ == "__main__":
    
    module_dir = "helpers\\data_collector\\"
    
    pipeline_filename_kierunki = module_dir + "output/kierunki.csv"
    dest = module_dir + "output/plany/"
    main_url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true"
    wydzialy = ["Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki"]
    output_file_dir = module_dir + "output/programy.json"
    
    # PIPELINE
    # 1.
    parse_study_programmes_to_csv(pipeline_filename_kierunki, main_url)
    
    # 2.
    scrape_study_plans_from_faculties(pipeline_filename_kierunki, dest, wydzialy)
    
    # 3.
    # parse_karty_przedmiotow_to_json(dest, output_file_dir)