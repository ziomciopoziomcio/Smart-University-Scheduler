import json
import re

PATH_TO_FINAL_PROGRAMS = "../../data_collector/final-programy.json"


def _normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace
    :param text: input text
    :return: normalized text
    """
    return re.sub(r"\s+", " ", text).strip()


def clean_teacher_txt(text: str) -> str:
    """
    Cleans and normalizes a raw teacher text string.
    :param text: input text
    :return: cleaned text
    """
    if not text:
        return ""

    text = _normalize_whitespace(text)
    text = re.sub(r"^-+\s*", "", text)
    return _normalize_whitespace(text)


def extract_degree_and_name(text: str) -> tuple[str, str]:
    """
    For example:
    'prof. dr hab. inż. Jan Kowalski' -> ('prof. dr hab. inż.', 'Jan Kowalski')
    'dr inż. Piotr Duch' -> ('dr inż.', 'Piotr Duch')
    'Aleksandra Urbaniak' -> ('', 'Aleksandra Urbaniak')
    """
    text = clean_teacher_txt(text)
    if not text:
        return "", ""

    degree_patterns = [
        r"^prof\.\s*dr\s*hab\.\s*inż\.",
        r"^prof\.\s*dr\s*hab\.",
        r"^dr\s*hab\.\s*inż\.",
        r"^dr\s*hab\.",
        r"^dr\s*inż\.",
        r"^mgr\s*inż\.",
        r"^mgr\b",
        r"^dr\b",
        r"^inż\.",
    ]

    for pattern in degree_patterns:
        match = re.match(pattern, text, flags=re.IGNORECASE)
        if match:
            degree = _normalize_whitespace(match.group(0))
            name = _normalize_whitespace(text[match.end() :])
            return degree, name

    return "", text


def rank_degree(degree: str) -> int:
    """
    Returns a numeric rank representing the academic degree hierarchy.
    :param degree: degree as string
    :return: rank
    """
    ranking = {
        "prof. dr hab. inż.": 8,
        "prof. dr hab.": 7,
        "dr hab. inż.": 6,
        "dr hab.": 5,
        "dr inż.": 4,
        "dr": 3,
        "mgr inż.": 2,
        "mgr": 1,
        "inż.": 0,
        "": -1,
    }
    return ranking.get(degree.lower().strip(), -1)


def split_name(name: str) -> tuple[str, str]:
    """
     Splits a full name string into first name(s) and last name.
    :param name: Full name as string
    :return: splitted name and last name
    """
    name = _normalize_whitespace(name)
    if not name:
        return "", ""

    parts = name.split(" ")
    if len(parts) == 1:
        return parts[0], ""

    first_name = " ".join(parts[:-1])
    last_name = parts[-1]
    return first_name, last_name


def _add_person(people: dict[str, dict], raw_person: str) -> None:
    """
    Adds or updates a person entry in the `people` dictionary based on raw text input.
    :param people: people data
    :param raw_person: raw input string representing a person
    :return: None
    """
    cleaned = clean_teacher_txt(raw_person)
    if not cleaned:
        return

    degree, full_name = extract_degree_and_name(cleaned)
    if not full_name:
        return

    first_name, last_name = split_name(full_name)
    if not first_name and not last_name:
        return

    key = f"{first_name.lower()}|{last_name.lower()}"
    new_rank = rank_degree(degree)

    if key not in people:
        people[key] = {
            "first_name": first_name,
            "last_name": last_name,
            "degree": degree,
        }
        return

    old_rank = rank_degree(people[key]["degree"])
    if new_rank > old_rank:
        people[key]["degree"] = degree


def extract_teachers(
    sourcefile: str = PATH_TO_FINAL_PROGRAMS,
) -> list[dict[str, str]]:
    """
    Extracts unique teachers from a JSON file.
    :param sourcefile: path to JSON file containing study field data
    :return: a sorted list of unique teachers
    """
    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    people: dict[str, dict[str, str]] = {}

    for kierunek in data:
        for semestr in kierunek.get("semestry", []):
            for przedmiot in semestr.get("przedmioty", []):
                kierownik = przedmiot.get("kierownik", "")
                if kierownik:
                    _add_person(people, kierownik)

                for realizator in przedmiot.get("realizatorzy", []):
                    _add_person(people, realizator)

    return sorted(
        people.values(), key=lambda x: (x["last_name"].lower(), x["first_name"].lower())
    )


# if __name__ == "__main__":
#     teachers = extract_teachers()
#
#     print(teachers)
