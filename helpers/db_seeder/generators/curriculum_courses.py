import json


def _get_study_field_major_degree_from_file(
    sourcefile: str, with_major=True
) -> list[tuple[str, int, str | None]]:
    """
    Load study program data from a JSON file and return unique combinations
    of (study field name, degree, major).
    :param sourcefile: path to JSON file containing study field data
    :param with_major: if True, includes major in the result.
            If False, major is set to None for all entries.
            Defaults to True.
    :return: a sorted list of unique tuples in the form:
            (study field name, degree, major)
    """
    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    unique_combinations: set[tuple[str, int, str | None]] = set()

    for study_field in data:
        study_field_name = study_field.get("nazwa", None)
        degree = study_field.get("stopien", None)
        if with_major:
            major = study_field.get("specjalizacja", None)
        else:
            major = None
        if study_field_name is None or degree is None:
            continue

        unique_combinations.add((study_field_name, int(degree), major))
    return sorted(list(unique_combinations))


def _get_unique_study_fields(
    sourcefile: str, study_field_name: str, degree: int
) -> list:
    """
    Load study field data from a JSON file and return unique combinations
    :param sourcefile: path to JSON file containing study field data
    :param study_field_name: name of the study field to filter
    :param degree: degree to filter
    :return: a list of unique study fields records (dictionaries) that match
            the given program name and degree.
    """
    with open(sourcefile, "r", encoding="utf-8") as f:
        data = json.load(f)

    added: set[tuple[str, int, str]] = set()
    records: list = []

    for study_field in data:
        name = study_field.get("nazwa", None)
        deg = study_field.get("stopien", None)
        major = study_field.get("specjalizacja", None)
        if name is None or deg is None:
            continue

        if name == study_field_name and deg == degree:
            if (name, deg, major) not in added:
                records.append(study_field)
                added.add((name, deg, major))

    return records


if __name__ == "__main__":
    path = "../../data_collector/final-programy.json"

    combs = _get_study_field_major_degree_from_file(path, with_major=False)
    for el in combs:
        print(el)

    kierunki = _get_unique_study_fields(path, "informatyka.", 1)
    print(len(kierunki))
