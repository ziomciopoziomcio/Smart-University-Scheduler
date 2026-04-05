def _read_list_from_txt(sourcefile: str) -> list[str]:
    """
    Reads a text file into a list
    :param sourcefile: txt file with list of names/surnames, one per line
    :return: list of names/surnames with whitespace removed and capitalized
    """
    with open(sourcefile, "r", encoding="utf-8") as f:
        lines = f.readlines()
    lines = [line.strip().capitalize() for line in lines]
    return lines


if "__main__" == __name__:
    male_names = _read_list_from_txt(sourcefile=r"../data/male_names.txt")
    female_names = _read_list_from_txt(sourcefile=r"../data/female_names.txt")
    male_surnames = _read_list_from_txt(sourcefile=r"../data/male_surnames.txt")
    female_surnames = _read_list_from_txt(sourcefile=r"../data/female_surnames.txt")

    print(male_names)
    print(female_names)
    print(male_surnames)
    print(female_surnames)
