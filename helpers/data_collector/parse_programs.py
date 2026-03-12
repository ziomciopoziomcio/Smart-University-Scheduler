from ProgramsParser import ProgramsParser

if __name__ == "__main__":
    
    pp = ProgramsParser(
                    module_dir="helpers\\data_collector\\",
                    plans_dir="plany\\",
                    majors_filename="kierunki.csv",
                    output="programy.json"
    )
    
    pp.get_programs(
                    faculties=["Wydział Elektrotechniki, Elektroniki, Informatyki i Automatyki"], 
                    get_details=True, 
                    clean=False,
                    overwrite=False)
    