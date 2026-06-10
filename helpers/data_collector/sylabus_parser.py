import requests
from bs4 import BeautifulSoup
import json
import re


# todo nie uwzglednia specjalności...

# todo mozna zrobic cos takiego, ze jesli z programy.p.lodz.pl sczytalo sie 0 planów na dany kierunek, to probowac sciagnac plan z sylabusa
# todo bo np na sium z weei link z programow p.lodz.pl przekierowuje na sylabusa



def get_meta_from_entry(entry, semester):
    """
        Wyodrębnia metadane dotyczące form zajęć oraz punktów ECTS z listy tekstowych wpisów.

        Funkcja analizuje każdą linię tekstu w przekazanej liście `entry`, wyszukuje liczby
        (np. liczbę godzin) oraz na podstawie słów kluczowych przypisuje je do odpowiednich
        kategorii zajęć.

        Obsługiwane typy zajęć:
        - Wykład (Wyk)
        - Laboratorium (Lab)
        - Projekt (Proj)
        - Ćwiczenia (Ćw.)
        - Seminarium (Semi.)
        - Praktyka
        - Internship
        - Praca dyplomowa / Diploma Thesis
        - Punkty ECTS
        - Forma zaliczenia (Zal.)

        Args:
            entry : list[str]
            semester : int

        Returns:
            dict
                Słownik z wykrytymi metadanymi, np.:
                {
                    "Semestr": 1
                    "Wyk": 30,
                    "Lab": 15,
                    "ECTS": 5,
                    "Zal.": "E"
                }
        """
    result = {}
    result["Semester"] = semester

    for item in entry:
        match = list(map(int, re.findall(r'\d+', item)))
        match_len = len(match)
        if match_len == 1 or match_len == 0:
            print(f"- {item}", end='')
            print(f"<{match}>")
            item_lower = item.lower()
            if "wykład" in item_lower or "lecture" in item_lower: # wykład
                result["Wyk"] = match[0]
            if "labor" in item_lower:   # lab
                result["Lab"] = match[0]
            if "proj" in item_lower:   # proj
                result["Proj"] = match[0]
            if "ćwiczenia" in item_lower or "tutorial" in item_lower:   # ćwiczenia
                result["Ćw."] = match[0]
            if "semin" in item_lower:   # seminarium
                result["Semi."] = match[0]
            if "praktyka" in item_lower:   # Praktyka
                result["Praktyka"] = match[0]
            if "internship" in item_lower:  # internship
                result["Internship"] = match[0]
            if "diploma thesis" in item_lower:  # Diploma Thesis
                result["Diploma Thesis"] = match[0]
            if "ects" in item_lower and match_len == 1: # ects
                result["ECTS"] = match[0]
            if "praca dyplomowa" in item_lower: # praca dyplomowa
                result["Praca d."] = match[0]
            if "forma weryfikacji" in item_lower or "form of verification" in item_lower: # zaliczenie
                if  "egzamin" in item_lower or "exam" in item_lower:
                    result["Zal."] = "E"
                else:
                    result["Zal."] = ""

    # print(result)
    return result


def scrap_study_programmes_sylabus(url):
    """
        Scrapuje dane z Sylabusa PŁ programu studiów ze strony podanej w `url`.
        Funkcja obsługuje zarówno polskie, jak i angielskie nazwy typów zajęć.

        Funkcja pobiera stronę HTML programu studiów, analizuje ją za pomocą
        BeautifulSoup i wyciąga następujące informacje:

        1. Opisy przedmiotów (liczba godzin wykładów, laboratoriów, ćwiczeń itp.)
        2. Nazwy przedmiotów
        3. Semestry, w których są realizowane

        Dane są walidowane pod kątem zgodności liczby przedmiotów z liczbą opisów
        (jeżeli nie pasują, rzucany jest wyjątek ValueError).

        Args:
            url : str
                Adres URL strony sylabusa programu studiów.

        Returns:
            dict
                Słownik, w którym kluczami są nazwy przedmiotów, a wartościami są
                słowniki z metadanymi o przedmiocie, np.:
                {
                    "Matematyka": {"Wyk": 30, "Lab": 15, "ECTS": 5, "Zal.": "E"},
                    "Fizyka": {"Wyk": 20, "Ćw.": 10, "ECTS": 4, "Zal.": ""}
                }
        """

    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")


    # ======================================================================================
    # pozyskiwanie opisów przedmiotów (liczba wykladow, zajec itp)
    meta = []

    dane = soup.find_all("dd", class_=["m-0"])
    cnt = 1
    skip = False

    current_group = []

    for el in dane:

        text = el.get_text(strip=True)

        if text == "": # tutaj dane ogolnie o przedmiocie obieralnym, dlatego pomijam
            skip = True
            continue
        if not skip:
            current_group.append(text)
        if "Obligatoryjność" in text or "Obligatory" in text:
            if not skip:
                meta.append({cnt: current_group})
                cnt += 1
                current_group = []
            skip = False




    # ======================================================================================
    # pozyskiwanie nazw przedmiotów

    elements = soup.select("button.btn.btn-link.syl-get-document.text-start.text-decoration-none.p-0, tr, a, caption")

    current_semester = 0

    subjects = []
    sems = []

    for el in elements:
        if el.name == "caption":
            if "specjalność" not in el.text.lower():
                current_semester += 1

        if el.name == "button":
            name = el.get_text(strip=True)
            subjects.append(name)
            sems.append(current_semester)

        elif el.name == "a":
            name = el.get_text(strip=True)
            if "Wychowanie fizyczne" in name or "Physical Education" in name:
                subjects.append(name)
                sems.append(current_semester)

        elif el.name == "tr":
            td = el.find("td")
            if not td:
                continue

            name = td.contents[0].strip()

            if not name:
                continue
            # if "Obligatoryjność" in name:
            #     continue
            if "Student wybiera" in name:
                continue
            if "The student chooses one" in name:
                continue
            if "elective courses" in name.lower():
                continue


            subjects.append(name)
            sems.append(current_semester)





    # WALIDACJA ZEBRANYCH DANYCH
    if len(subjects) != len(meta):
        raise ValueError(
            f"Niezgodna liczba elementów: subjects={len(subjects)}, meta={len(meta)}"
        )



    # WYSWIETLENIE
    subject_and_meta_dict = {}
    for i in range(len(meta)):
        print(f"{i+1}. {subjects[i]} - semestr {sems[i]}")
        for entry in meta[i].values():
            res = get_meta_from_entry(entry, sems[i])
            print(res)
            subject_and_meta_dict[subjects[i]] = res

        print()
        print()

    return subject_and_meta_dict



if __name__ == "__main__":
    
    url = "https://www.sylabus.p.lodz.pl/pl/1/2/3/1/3/0/41#nav-tab-7" # informatyka magisterska - dziala
    # url = "https://sylabus.p.lodz.pl/pl/1/2/4/1/1/2/31" # eit - dziala
    # url = "https://sylabus.p.lodz.pl/pl/1/2/4/1/1/7/52"  # mads (wtims) - dziala
    # url = "https://sylabus.p.lodz.pl/pl/1/2/3/1/3/2/10" # Elektrotechnika - dziala (bez specjalności)
    # url = "https://sylabus.p.lodz.pl/pl/1/2/3/1/1/8/5" # Digital Management - oiz
    # url = "https://sylabus.p.lodz.pl/pl/1/2/3/1/1/4/13#nav-tab-7" # Inżynieria wzornictwa przemysłowego - włókiennictwo
    # url = "https://sylabus.p.lodz.pl/pl/1/2/3/1/2/5/15" # Menedżer żywności i żywienia - binoż

    res = scrap_study_programmes_sylabus(url)

    for key, value in res.items():
        print(f"{key}: {value}")