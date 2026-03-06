import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import csv


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


if __name__ == "__main__":
    filename = "kierunki.csv"
    url = "https://programy.p.lodz.pl/ectslabel-web/?l=pl&wersja202526=true"
    parse_study_programmes_to_csv(filename, url)