import random


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


def _generate_full_names(
    names: list[str], surnames: list[str], n: int, with_duplicates: bool = False
) -> list[tuple[str, str]]:
    """
    Generates a list of full names by randomly combining names and surnames.
    :param names: list of names
    :param surnames: list of surnames
    :param n: number of full names
    :return: list of full names
    """
    if with_duplicates:
        return [(random.choice(names), random.choice(surnames)) for _ in range(n)]
    else:
        max_combinations = len(names) * len(surnames)
        if n > max_combinations:
            raise ValueError("Not enough unique combinations")

        result = set()

        while len(result) < n:
            pair = (random.choice(names), random.choice(surnames))
            result.add(pair)

        return list(result)


if "__main__" == __name__:
    male_names = _read_list_from_txt(sourcefile=r"../data/male_names.txt")
    female_names = _read_list_from_txt(sourcefile=r"../data/female_names.txt")
    male_surnames = _read_list_from_txt(sourcefile=r"../data/male_surnames.txt")
    female_surnames = _read_list_from_txt(sourcefile=r"../data/female_surnames.txt")

    male_full_names = _generate_full_names(
        male_names, male_surnames, n=10, with_duplicates=False
    )
    female_full_names = _generate_full_names(
        female_names, female_surnames, n=10, with_duplicates=False
    )
    print(male_full_names)
    print(female_full_names)
