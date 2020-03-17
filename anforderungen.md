project
  create
    - erstellt die komplette verzeichnisstruktur
    - macht das projekt in der registry (app/roamimg) bekannt
     
  list
    - listet alle bekannten projekte auf

  remove
    - löscht das verzeichnis
    - nimmt das projekt aus der registry
    - fragt nach ob die projekt-schemas entfernt werden soll
    - fragt nach ob die features ebenfalls rausgenommen werden

  init
    - erstellt die projekt dependencies (schemas) + option?loop über feature install xxx
    

feature
  add
    - fügt das feature yml - mäßig dem projekt hinzu
    - lädt das zeug aus dem internet (artifacts / zips)
  
  install
    - installiert feature x in die db

  list
    - listet verfügbare features auf
    - listet features laut registry 
    - listet feature laut target-param

  remove
    - löscht aus des yml
    - fragt nach ob auch aus der db entfernt werden soll
    - 

deploy
  init
    - erstellt die dependencies
      - features
      - project-schema-user
      - acls...#
      - grants

  build
    - mit init install lässt das aktuell Projekt gegen das Ziel laufen
    - mit init maj.min.fix erstellt initial.zip
    - mit patch maj.min.fix erstellt das patch.zip 

  apply 
    - mit (init/patch) entpackt das zip und ruft das zeug auf
    
  orcas




project:update

project:deploy -target local:123/pdb1 
  mit para
  gibt es db_params?
  


cd projet
xcl feature:list
