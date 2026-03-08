# ProgramsParser

## Ogólne

Klasa `ProgramsParser` to narzędzie do scrapowania danych z portalu [ECTS Label Politechniki Łódzkiej](https://programy.p.lodz.pl/ectslabel-web/). Umożliwia pobieranie list kierunków, planów studiów dla poszczególnych roczników oraz szczegółowych kart przedmiotów.

## Wymagania

- Python 3.x
- Biblioteki: `requests`, `beautifulsoup4`


## Konstruktor

```python
pp = ProgramsParser(module_dir, plans_dir, majors_filename, output)
```

|Parametr|Typ|Opis|
|:------|:------|:------|
`module_dir`|`str`|Ścieżka bazowa modułu|
`plans_dir`|`str`|folder tymczasowy na pliki CSV z planami (wewnątrz `module_dir`)|
`majors_filename`|`str`|Nazwa pliku CSV z listą wszystkich kierunków.|
`output`|`str`|Nazwa docelowego pliku JSON|

## Szybki start

```python
pp = ProgramsParser(
                    module_dir="helpers\\data_collector\\",
                    plans_dir="plany\\",
                    majors_filename="kierunki.csv",
                    output="programy.json"
                    )
    
pp.get_programs(
                faculties=["Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki"], 
                get_details=True, 
                clean=True
                )
```

## Metody główne

```python
get_programs()
```
Główna metoda sterująca procesem.

Argumenty:
- faculties (list): Lista nazw wydziałów (np. ["WEEIA"]). Jeśli None lub "all", przetwarza wszystko.

- clean (bool): Czy usunąć pliki tymczasowe po zakończeniu pracy.

- get_details (bool): Czy pobierać szczegółowe dane o prowadzących (wymaga dodatkowych zapytań HTTP).

## Struktura pliku wyjściowego

### Rozszerzony (`get_details=True`)
```json
{
        "nazwa": "automatyka i sterowanie robotów",
        "wydzial": "Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki",
        "stopien": 1,
        "stacjonarne": true,
        "specjalizacja": null,
        "semestry": [
            {
                "nazwa": "Semestr 1",
                "przedmioty": [
                    {
                        "Kod przedmiotu": "01 35 0342 00",
                        "Nazwa przedmiotu w języku polskim": "Statyka i kinematyka",
                        "ECTS": "5",
                        "W": "30",
                        "Ć": "15",
                        "L": "",
                        "P": "",
                        "S": "",
                        "I": "",
                        "E-Learn.": "",
                        "Zal.": "",
                        "jednostka": "Katedra Dynamiki Maszyn",
                        "kierownik": "...",
                        "realizatorzy": [
                            "..."
                        ]
                    },
                    ...
                ]
            },
            ...
        ],
        "od": "2020/2021"
}

```

### Prosty (`get_details=False`)

```json
{
        "nazwa": "automatyka i sterowanie robotów",
        "wydzial": "Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki",
        "stopien": 1,
        "stacjonarne": true,
        "specjalizacja": null,
        "semestry": [
            {
                "nazwa": "Semestr 1",
                "przedmioty": [
                    {
                        "Kod przedmiotu": "01 35 0342 00",
                        "Nazwa przedmiotu w języku polskim": "Statyka i kinematyka",
                        "ECTS": "5",
                        "W": "30",
                        "Ć": "15",
                        "L": "",
                        "P": "",
                        "S": "",
                        "I": "",
                        "E-Learn.": "",
                        "Zal.": "",
                    },
                    ...
                ]
            },
            ...
        ],
        "od": "2020/2021"
}
```

## Uwagi
Skrypt automatycznie ustawia kodowanie utf-8 dla wszystkich operacji plikowych.

W przypadku błędu połączenia lub braku elementu na stronie, metoda loguje błąd i kontynuuje pracę dla następnych rekordów.

Limitowanie zapytań: Opcja get_details=True znacznie wydłuża czas działania ze względu na dużą liczbę zapytań HTTP (jedno na każdy przedmiot).