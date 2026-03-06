import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import csv
import re


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


if __name__ == "__main__":
    # # scrape_study_plans_to_csv
    # dest = "plany/"
    # kierunek = "informatyka"
    # url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true&s=programKsztalcenia&pk=informatyka.&v=4"
    #
    # scrape_study_plans_to_csv(dest, kierunek, url)
    #
    #
    # # scrape_study_plans_from_courses
    # sourcefile = "kierunki.csv"
    # dest = "plany/"
    #
    # scrape_study_plans_from_courses(sourcefile, dest, start=0, end=4)

    # scrape_study_plans_from_faculties
    sourcefile = "kierunki.csv"
    dest = "plany/"
    wydzial = ["Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki"]
    scrape_study_plans_from_faculties(sourcefile, dest, wydzial)
