// Comprehensive geo data structure for Greece and Cyprus

export interface GeoItem {
  id: string;
  name: string;
  code?: string;
}

export interface CountryItem extends GeoItem {
  regions: RegionItem[];
}

export interface RegionItem extends GeoItem {
  cities: CityItem[];
}

export interface CityItem extends GeoItem {
  // Additional city data if needed
}

// Comprehensive data for Greek and Cypriot regions and cities
export const geoData: CountryItem[] = [
  {
    id: "GR",
    name: "Ελλάδα",
    code: "GR",
    regions: [
      {
        id: "attica",
        name: "Αττική",
        cities: [
          { id: "athens", name: "Αθήνα" },
          { id: "piraeus", name: "Πειραιάς" },
          { id: "glyfada", name: "Γλυφάδα" },
          { id: "kifisia", name: "Κηφισιά" },
          { id: "kallithea", name: "Καλλιθέα" },
          { id: "nea-smyrni", name: "Νέα Σμύρνη" },
          { id: "peristeri", name: "Περιστέρι" },
          { id: "marousi", name: "Μαρούσι" },
          { id: "ilioupoli", name: "Ηλιούπολη" },
          { id: "chalandri", name: "Χαλάνδρι" },
          { id: "palaio-faliro", name: "Παλαιό Φάληρο" },
          { id: "agios-dimitrios", name: "Άγιος Δημήτριος" },
          { id: "voula", name: "Βούλα" },
          { id: "vouliagmeni", name: "Βουλιαγμένη" },
          { id: "vari", name: "Βάρη" },
          { id: "elefsina", name: "Ελευσίνα" },
          { id: "megara", name: "Μέγαρα" },
          { id: "acharnes", name: "Αχαρνές" },
          { id: "salamina", name: "Σαλαμίνα" },
          { id: "aegina", name: "Αίγινα" },
          { id: "lavrio", name: "Λαύριο" },
          { id: "rafina", name: "Ραφήνα" },
          { id: "marathon", name: "Μαραθώνας" },
        ],
      },
      {
        id: "central-macedonia",
        name: "Κεντρική Μακεδονία",
        cities: [
          { id: "thessaloniki", name: "Θεσσαλονίκη" },
          { id: "serres", name: "Σέρρες" },
          { id: "katerini", name: "Κατερίνη" },
          { id: "veroia", name: "Βέροια" },
          { id: "edessa", name: "Έδεσσα" },
          { id: "giannitsa", name: "Γιαννιτσά" },
          { id: "kilkis", name: "Κιλκίς" },
          { id: "naoussa", name: "Νάουσα" },
          { id: "kalamaria", name: "Καλαμαριά" },
          { id: "pylaia", name: "Πυλαία" },
          { id: "neapolis", name: "Νεάπολη" },
          { id: "stavroupoli", name: "Σταυρούπολη" },
          { id: "evosmos", name: "Εύοσμος" },
          { id: "ampelokipoi", name: "Αμπελόκηποι" },
          { id: "oraiokastro", name: "Ωραιόκαστρο" },
          { id: "sindos", name: "Σίνδος" },
          { id: "lagkadas", name: "Λαγκαδάς" },
          { id: "pefka", name: "Πεύκα" },
          { id: "panorama", name: "Πανόραμα" },
          { id: "thermi", name: "Θέρμη" },
          { id: "polichni", name: "Πολίχνη" },
          { id: "kordelio", name: "Κορδελιό" },
          { id: "nea-moudania", name: "Νέα Μουδανιά" },
          { id: "alexandria", name: "Αλεξάνδρεια" },
          { id: "skydra", name: "Σκύδρα" },
          { id: "aiginio", name: "Αιγίνιο" },
          { id: "litochoro", name: "Λιτόχωρο" },
          { id: "koufalia", name: "Κουφάλια" },
          { id: "anatoliko", name: "Ανατολικό" },
          { id: "chalastra", name: "Χαλάστρα" },
          { id: "agios-athanasios", name: "Άγιος Αθανάσιος" },
          { id: "efkarpia", name: "Ευκαρπία" },
          { id: "sykies", name: "Συκιές" },
          { id: "nea-michaniona", name: "Νέα Μηχανιώνα" },
          { id: "peraia", name: "Περαία" },
          { id: "agia-triada", name: "Αγία Τριάδα" },
          { id: "nea-kallikrateia", name: "Νέα Καλλικράτεια" },
          { id: "nea-triglia", name: "Νέα Τρίγλια" },
          { id: "platamonas", name: "Πλαταμώνας" },
        ],
      },
      {
        id: "chalkidiki",
        name: "Χαλκιδική",
        cities: [
          { id: "polygyros", name: "Πολύγυρος" },
          { id: "nea-moudania", name: "Νέα Μουδανιά" },
          { id: "nea-kallikrateia", name: "Νέα Καλλικράτεια" },
          { id: "arnaia", name: "Αρναία" },
          { id: "ierissos", name: "Ιερισσός" },
          { id: "neos-marmaras", name: "Νέος Μαρμαράς" },
          { id: "nikiti", name: "Νικήτη" },
          { id: "kassandra", name: "Κασσάνδρα" },
          { id: "kallithea", name: "Καλλιθέα" },
          { id: "afytos", name: "Άφυτος" },
          { id: "kriopigi", name: "Κρυοπηγή" },
          { id: "hanioti", name: "Χανιώτη" },
          { id: "pefkochori", name: "Πευκοχώρι" },
          { id: "polichrono", name: "Πολύχρονο" },
          { id: "fourka", name: "Φούρκα" },
          { id: "possidi", name: "Ποσείδι" },
          { id: "sani", name: "Σάνη" },
          { id: "metamorfossi", name: "Μεταμόρφωση" },
          { id: "gerakini", name: "Γερακινή" },
          { id: "psakoudia", name: "Ψακούδια" },
          { id: "ouranoupoli", name: "Ουρανούπολη" },
          { id: "stratoni", name: "Στρατώνι" },
          { id: "marathoussa", name: "Μαραθούσσα" },
          { id: "vrastama", name: "Βραστάμα" },
          { id: "megali-panagia", name: "Μεγάλη Παναγία" },
          { id: "palaiochori", name: "Παλαιοχώρι" },
          { id: "vavdos", name: "Βάβδος" },
          { id: "parthenonas", name: "Παρθενώνας" },
          { id: "sithonia", name: "Σιθωνία" },
          { id: "sarti", name: "Σάρτη" },
          { id: "vourvourou", name: "Βουρβουρού" },
          { id: "toroni", name: "Τορώνη" },
          { id: "porto-koufo", name: "Πόρτο Κουφό" },
          { id: "ormylia", name: "Ορμύλια" },
        ],
      },
      {
        id: "east-macedonia-thrace",
        name: "Ανατολική Μακεδονία & Θράκη",
        cities: [
          { id: "kavala", name: "Καβάλα" },
          { id: "drama", name: "Δράμα" },
          { id: "xanthi", name: "Ξάνθη" },
          { id: "komotini", name: "Κομοτηνή" },
          { id: "alexandroupoli", name: "Αλεξανδρούπολη" },
          { id: "orestiada", name: "Ορεστιάδα" },
          { id: "didymoteicho", name: "Διδυμότειχο" },
          { id: "soufli", name: "Σουφλί" },
          { id: "feres", name: "Φέρες" },
          { id: "samothraki", name: "Σαμοθράκη" },
          { id: "thasos", name: "Θάσος" },
          { id: "chrysoupoli", name: "Χρυσούπολη" },
          { id: "eleftheroupoli", name: "Ελευθερούπολη" },
          { id: "nea-peramos", name: "Νέα Πέραμος" },
          { id: "nea-karvali", name: "Νέα Καρβάλη" },
          { id: "keramoti", name: "Κεραμωτή" },
          { id: "prosotsani", name: "Προσοτσάνη" },
          { id: "doxato", name: "Δοξάτο" },
          { id: "kato-nevrokopi", name: "Κάτω Νευροκόπι" },
          { id: "paranesti", name: "Παρανέστι" },
          { id: "stavroupoli-xanthi", name: "Σταυρούπολη Ξάνθης" },
          { id: "avdira", name: "Άβδηρα" },
          { id: "toxotes", name: "Τοξότες" },
          { id: "echinos", name: "Εχίνος" },
          { id: "iasmos", name: "Ίασμος" },
          { id: "sapes", name: "Σάπες" },
          { id: "xylagani", name: "Ξυλαγανή" },
          { id: "arriana", name: "Αρριανά" },
          { id: "neo-sidirochori", name: "Νέο Σιδηροχώρι" },
          { id: "kyprinos", name: "Κυπρίνος" },
          { id: "filiria", name: "Φυλλύρια" },
          { id: "avanta", name: "Άβαντα" },
          { id: "makri", name: "Μάκρη" },
        ],
      },
      {
        id: "west-macedonia",
        name: "Δυτική Μακεδονία",
        cities: [
          { id: "kozani", name: "Κοζάνη" },
          { id: "ptolemaida", name: "Πτολεμαΐδα" },
          { id: "kastoria", name: "Καστοριά" },
          { id: "florina", name: "Φλώρινα" },
          { id: "grevena", name: "Γρεβενά" },
          { id: "siatista", name: "Σιάτιστα" },
          { id: "velventos", name: "Βελβεντός" },
          { id: "servia", name: "Σέρβια" },
          { id: "deskati", name: "Δεσκάτη" },
          { id: "neapoli", name: "Νεάπολη" },
          { id: "tsotyli", name: "Τσοτύλι" },
          { id: "argos-orestiko", name: "Άργος Ορεστικό" },
          { id: "nestorio", name: "Νεστόριο" },
          { id: "aetos", name: "Αετός" },
          { id: "mesovounio", name: "Μεσοβούνι" },
          { id: "amyntaio", name: "Αμύνταιο" },
          { id: "aridaia", name: "Αριδαία" },
          { id: "meliti", name: "Μελίτη" },
          { id: "vevi", name: "Βεύη" },
          { id: "agia-paraskevi", name: "Αγία Παρασκευή" },
          { id: "drosopigi", name: "Δροσοπηγή" },
          { id: "prespes", name: "Πρέσπες" },
          { id: "deskovitsa", name: "Δεσκοβίτσα" },
          { id: "anargyri", name: "Ανάργυροι" },
          { id: "eordaia", name: "Εορδαία" },
          { id: "kozitsa", name: "Κοζίτσα" },
          { id: "pentalofo", name: "Πεντάλοφο" },
          { id: "perdikas", name: "Πέρδικας" },
        ],
      },
      {
        id: "epirus",
        name: "Ήπειρος",
        cities: [
          { id: "ioannina", name: "Ιωάννινα" },
          { id: "arta", name: "Άρτα" },
          { id: "preveza", name: "Πρέβεζα" },
          { id: "igoumenitsa", name: "Ηγουμενίτσα" },
          { id: "metsovo", name: "Μέτσοβο" },
          { id: "parga", name: "Πάργα" },
        ],
      },
      {
        id: "thessaly",
        name: "Θεσσαλία",
        cities: [
          { id: "larissa", name: "Λάρισα" },
          { id: "volos", name: "Βόλος" },
          { id: "trikala", name: "Τρίκαλα" },
          { id: "karditsa", name: "Καρδίτσα" },
          { id: "tyrnavos", name: "Τύρναβος" },
          { id: "kalambaka", name: "Καλαμπάκα" },
          { id: "almyros", name: "Αλμυρός" },
          { id: "farsala", name: "Φάρσαλα" },
          { id: "skiathos", name: "Σκιάθος" },
          { id: "skopelos", name: "Σκόπελος" },
          { id: "alonissos", name: "Αλόννησος" },
        ],
      },
      {
        id: "ionian-islands",
        name: "Ιόνιοι Νήσοι",
        cities: [
          { id: "corfu", name: "Κέρκυρα" },
          { id: "zakynthos", name: "Ζάκυνθος" },
          { id: "kefalonia", name: "Κεφαλονιά" },
          { id: "lefkada", name: "Λευκάδα" },
          { id: "ithaki", name: "Ιθάκη" },
          { id: "paxoi", name: "Παξοί" },
        ],
      },
      {
        id: "western-greece",
        name: "Δυτική Ελλάδα",
        cities: [
          { id: "patras", name: "Πάτρα" },
          { id: "agrinio", name: "Αγρίνιο" },
          { id: "messolonghi", name: "Μεσολόγγι" },
          { id: "nafpaktos", name: "Ναύπακτος" },
          { id: "aigio", name: "Αίγιο" },
          { id: "pyrgos", name: "Πύργος" },
          { id: "amaliada", name: "Αμαλιάδα" },
          { id: "kato-achaia", name: "Κάτω Αχαΐα" },
        ],
      },
      {
        id: "central-greece",
        name: "Στερεά Ελλάδα",
        cities: [
          { id: "lamia", name: "Λαμία" },
          { id: "chalkida", name: "Χαλκίδα" },
          { id: "livadeia", name: "Λιβαδειά" },
          { id: "thebes", name: "Θήβα" },
          { id: "arachova", name: "Αράχωβα" },
          { id: "amfissa", name: "Άμφισσα" },
          { id: "karpenisi", name: "Καρπενήσι" },
          { id: "itea", name: "Ιτέα" },
          { id: "galaxidi", name: "Γαλαξίδι" },
          { id: "eretria", name: "Ερέτρια" },
          { id: "edipsos", name: "Αιδηψός" },
          { id: "skyros", name: "Σκύρος" },
        ],
      },
      {
        id: "peloponnese",
        name: "Πελοπόννησος",
        cities: [
          { id: "kalamata", name: "Καλαμάτα" },
          { id: "sparta", name: "Σπάρτη" },
          { id: "tripoli", name: "Τρίπολη" },
          { id: "corinth", name: "Κόρινθος" },
          { id: "argos", name: "Άργος" },
          { id: "nafplio", name: "Ναύπλιο" },
          { id: "megalopoli", name: "Μεγαλόπολη" },
          { id: "gythio", name: "Γύθειο" },
          { id: "monemvasia", name: "Μονεμβασιά" },
          { id: "kalavryta", name: "Καλάβρυτα" },
          { id: "xylokastro", name: "Ξυλόκαστρο" },
          { id: "kiato", name: "Κιάτο" },
          { id: "loutraki", name: "Λουτράκι" },
          { id: "epidavros", name: "Επίδαυρος" },
          { id: "pylos", name: "Πύλος" },
        ],
      },
      {
        id: "north-aegean",
        name: "Βόρειο Αιγαίο",
        cities: [
          { id: "mytilene", name: "Μυτιλήνη" },
          { id: "chios", name: "Χίος" },
          { id: "samos", name: "Σάμος" },
          { id: "karlovassi", name: "Καρλόβασι" },
          { id: "ikaria", name: "Ικαρία" },
          { id: "limnos", name: "Λήμνος" },
          { id: "plomari", name: "Πλωμάρι" },
          { id: "agios-kirykos", name: "Άγιος Κήρυκος" },
        ],
      },
      {
        id: "south-aegean",
        name: "Νότιο Αιγαίο",
        cities: [
          { id: "rhodes", name: "Ρόδος" },
          { id: "kos", name: "Κως" },
          { id: "kalymnos", name: "Κάλυμνος" },
          { id: "leros", name: "Λέρος" },
          { id: "patmos", name: "Πάτμος" },
          { id: "syros", name: "Σύρος" },
          { id: "ermoupoli", name: "Ερμούπολη" },
          { id: "mykonos", name: "Μύκονος" },
          { id: "paros", name: "Πάρος" },
          { id: "naxos", name: "Νάξος" },
          { id: "santorini", name: "Σαντορίνη" },
          { id: "andros", name: "Άνδρος" },
          { id: "tinos", name: "Τήνος" },
          { id: "milos", name: "Μήλος" },
          { id: "karpathos", name: "Κάρπαθος" },
          { id: "astypalaia", name: "Αστυπάλαια" },
          { id: "kea", name: "Κέα" },
          { id: "amorgos", name: "Αμοργός" },
          { id: "symi", name: "Σύμη" },
          { id: "ios", name: "Ίος" },
          { id: "folegandros", name: "Φολέγανδρος" },
          { id: "sifnos", name: "Σίφνος" },
          { id: "serifos", name: "Σέριφος" },
        ],
      },
      {
        id: "crete",
        name: "Κρήτη",
        cities: [
          { id: "heraklion", name: "Ηράκλειο" },
          { id: "chania", name: "Χανιά" },
          { id: "rethymno", name: "Ρέθυμνο" },
          { id: "agios-nikolaos", name: "Άγιος Νικόλαος" },
          { id: "sitia", name: "Σητεία" },
          { id: "ierapetra", name: "Ιεράπετρα" },
          { id: "kissamos", name: "Κίσσαμος" },
          { id: "malia", name: "Μάλια" },
          { id: "hersonissos", name: "Χερσόνησος" },
          { id: "agios-antonios", name: "Άγιος Αντώνιος" },
          { id: "moires", name: "Μοίρες" },
          { id: "paleochora", name: "Παλαιόχωρα" },
          { id: "spili", name: "Σπήλι" },
          { id: "archanes", name: "Αρχάνες" },
          { id: "viannos", name: "Βιάννος" },
          { id: "zaros", name: "Ζαρός" },
          { id: "matala", name: "Μάταλα" },
          { id: "plakias", name: "Πλακιάς" },
        ],
      },
    ],
  },
  {
    id: "CY",
    name: "Κύπρος",
    code: "CY",
    regions: [
      {
        id: "nicosia-district",
        name: "Επαρχία Λευκωσίας",
        cities: [
          { id: "nicosia", name: "Λευκωσία" },
          { id: "strovolos", name: "Στρόβολος" },
          { id: "lakatamia", name: "Λακατάμια" },
          { id: "latsia", name: "Λατσιά" },
          { id: "aglantzia", name: "Αγλαντζιά" },
          { id: "agios-dometios", name: "Άγιος Δομέτιος" },
          { id: "engomi", name: "Έγκωμη" },
          { id: "geri", name: "Γέρι" },
          { id: "dali", name: "Δάλι" },
          { id: "peristerona", name: "Περιστερώνα" },
        ],
      },
      {
        id: "limassol-district",
        name: "Επαρχία Λεμεσού",
        cities: [
          { id: "limassol", name: "Λεμεσός" },
          { id: "mesa-geitonia", name: "Μέσα Γειτονιά" },
          { id: "agios-athanasios", name: "Άγιος Αθανάσιος" },
          { id: "germasogeia", name: "Γερμασόγεια" },
          { id: "kato-polemidia", name: "Κάτω Πολεμίδια" },
          { id: "ypsonas", name: "Ύψωνας" },
          { id: "pissouri", name: "Πισσούρι" },
          { id: "kolossi", name: "Κολόσσι" },
          { id: "episkopi", name: "Επισκοπή" },
          { id: "erimi", name: "Ερήμη" },
        ],
      },
      {
        id: "paphos-district",
        name: "Επαρχία Πάφου",
        cities: [
          { id: "paphos", name: "Πάφος" },
          { id: "geroskipou", name: "Γεροσκήπου" },
          { id: "peyia", name: "Πέγεια" },
          { id: "chlorakas", name: "Χλώρακα" },
          { id: "polis", name: "Πόλις Χρυσοχούς" },
          { id: "kissonerga", name: "Κισσόνεργα" },
          { id: "tala", name: "Τάλα" },
          { id: "drousia", name: "Δρούσια" },
          { id: "kathikas", name: "Κάθηκας" },
        ],
      },
      {
        id: "larnaca-district",
        name: "Επαρχία Λάρνακας",
        cities: [
          { id: "larnaca", name: "Λάρνακα" },
          { id: "aradippou", name: "Αραδίππου" },
          { id: "dromolaxia", name: "Δρομολαξιά" },
          { id: "kiti", name: "Κίτι" },
          { id: "livadia", name: "Λιβάδια" },
          { id: "xylofagou", name: "Ξυλοφάγου" },
          { id: "pervolia", name: "Περβόλια" },
          { id: "zygi", name: "Ζύγι" },
          { id: "kofinou", name: "Κοφίνου" },
        ],
      },
      {
        id: "famagusta-district",
        name: "Επαρχία Αμμοχώστου",
        cities: [
          { id: "ayia-napa", name: "Αγία Νάπα" },
          { id: "paralimni", name: "Παραλίμνι" },
          { id: "deryneia", name: "Δερύνεια" },
          { id: "sotira", name: "Σωτήρα" },
          { id: "liopetri", name: "Λιοπέτρι" },
          { id: "frenaros", name: "Φρέναρος" },
          { id: "avgorou", name: "Αυγόρου" },
          { id: "xylophagou", name: "Ξυλοφάγου" },
        ],
      },
      {
        id: "kyrenia-district",
        name: "Επαρχία Κερύνειας",
        cities: [
          { id: "kyrenia", name: "Κερύνεια" },
          { id: "agios-amvrosios", name: "Άγιος Αμβρόσιος" },
          { id: "karavas", name: "Καραβάς" },
          { id: "lapithos", name: "Λάπηθος" },
        ],
      },
    ],
  },
];

// Helper functions to get geo data

export const getCountries = (): CountryItem[] => {
  return geoData;
};

export const getRegionsByCountry = (countryId: string): RegionItem[] => {
  const country = geoData.find(c => c.id === countryId);
  return country ? country.regions : [];
};

export const getCitiesByRegion = (countryId: string, regionId: string): CityItem[] => {
  const country = geoData.find(c => c.id === countryId);
  if (!country) return [];
  
  const region = country.regions.find(r => r.id === regionId);
  return region ? region.cities : [];
};

// Helper to find items by name (for setting defaults from user's location)
export const findCountryByName = (name: string): CountryItem | undefined => {
  return geoData.find(country => 
    country.name.toLowerCase() === name.toLowerCase()
  );
};

export const findRegionByName = (countryId: string, name: string): RegionItem | undefined => {
  const country = geoData.find(c => c.id === countryId);
  if (!country) return undefined;
  
  return country.regions.find(region => 
    region.name.toLowerCase() === name.toLowerCase()
  );
};

export const findCityByName = (countryId: string, regionId: string, name: string): CityItem | undefined => {
  const country = geoData.find(c => c.id === countryId);
  if (!country) return undefined;
  
  const region = country.regions.find(r => r.id === regionId);
  if (!region) return undefined;
  
  return region.cities.find(city => 
    city.name.toLowerCase() === name.toLowerCase()
  );
};