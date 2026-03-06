import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import csv
import re


def scrape_study_plans_to_csv(dest, kierunek, url):
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



if __name__ == "__main__":
    dest = "plany/"
    kierunek = "informatyka"
    url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true&s=programKsztalcenia&pk=informatyka.&v=4"
    scrape_study_plans_to_csv(dest, kierunek, url)