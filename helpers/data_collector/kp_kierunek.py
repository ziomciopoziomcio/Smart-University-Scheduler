import requests
from bs4 import BeautifulSoup as soup


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
    soup_page = soup(response.text, "html.parser")

    # INFORMACJE OGÓLNE O KIERUNKU
    args = url.split("&")[1:]
    args_dict = {arg.split("=")[0]: arg.split("=")[1] for arg in args}
    
    kierunek = {
        "nazwa" : args_dict["w"],
        "wydzial" : wydzial,
        "stopien" : 1 if args_dict["stopien"] == "studia%20pierwszego%20stopnia" else 2,
        "stacjonarne" : args_dict["tryb"] == "studia%20stacjonarne",
        "specjalizacja": int(args_dict["sp"]),
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
                        karta = soup(response_card.text, "html.parser")

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



if __name__ == "__main__":

    test_url = "https://programy.p.lodz.pl/ectslabel-web/kierunekSiatkaV4.jsp?l=pl&w=informatyka.&pkId=1672&p=7631&stopien=studia%20pierwszego%20stopnia&tryb=studia%20stacjonarne&v=4&sp=1"

    kierunek = parse_subject(test_url, "WEEIA", True)
    # print(kierunek)
    
    with open("test_informatyka.json", "w", encoding="utf-8") as f:
        json.dump(kierunek, f)