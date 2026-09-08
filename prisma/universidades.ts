/** Directorio de instituciones afiliadas a la ANUIES, por entidad.
 *
 *  Tomado del directorio de IES afiliadas a CUPIA que publica la propia
 *  ANUIES. El estado es el de la sede de la institución, y es lo que acota las
 *  sugerencias del paso 1: elegir entre las de un estado es manejable, entre
 *  las de todo el país no.
 *
 *  El campo de universidad sigue siendo texto libre. El catálogo alimenta las
 *  sugerencias y el reconocimiento automático; una institución que no
 *  aparezca se captura igual y queda marcada para revisión en el detalle. */
export const UNIVERSIDADES: { nombre: string; siglas: string; estado: string }[] = [

  // --- Aguascalientes ---
  { nombre: "Universidad Autónoma de Aguascalientes", siglas: "UAA", estado: "Aguascalientes" },
  { nombre: "Universidad Politécnica de Aguascalientes", siglas: "UPA", estado: "Aguascalientes" },
  { nombre: "Universidad Tecnológica de Aguascalientes", siglas: "UTAGS", estado: "Aguascalientes" },
  { nombre: "Universidad Tecnológica de Calvillo", siglas: "UTC Calvillo", estado: "Aguascalientes" },
  { nombre: "Universidad Tecnológica del Norte de Aguascalientes", siglas: "UTNA", estado: "Aguascalientes" },
  { nombre: "Universidad Tecnológica El Retoño", siglas: "UTR", estado: "Aguascalientes" },

  // --- Baja California ---
  { nombre: "Centro de Investigación Científica y de Educación Superior de Ensenada", siglas: "CICESE", estado: "Baja California" },
  { nombre: "El Colegio de la Frontera Norte", siglas: "COLEF", estado: "Baja California" },
  { nombre: "Universidad Autónoma de Baja California", siglas: "UABC", estado: "Baja California" },

  // --- Baja California Sur ---
  { nombre: "Centro de Investigaciones Biológicas del Noroeste", siglas: "CIBNOR", estado: "Baja California Sur" },
  { nombre: "Universidad Autónoma de Baja California Sur", siglas: "UABCS", estado: "Baja California Sur" },

  // --- Campeche ---
  { nombre: "Universidad Autónoma de Campeche", siglas: "UACAM", estado: "Campeche" },
  { nombre: "Universidad Autónoma del Carmen", siglas: "UNACAR", estado: "Campeche" },

  // --- Chiapas ---
  { nombre: "El Colegio de la Frontera Sur", siglas: "ECOSUR", estado: "Chiapas" },
  { nombre: "Universidad Autónoma de Chiapas", siglas: "UNACH", estado: "Chiapas" },
  { nombre: "Universidad Autónoma de Ciencias y Artes de Chiapas", siglas: "UNICACH", estado: "Chiapas" },
  { nombre: "Universidad Politécnica de Chiapas", siglas: "UPChiapas", estado: "Chiapas" },

  // --- Chihuahua ---
  { nombre: "Centro de Investigación en Materiales Avanzados", siglas: "CIMAV", estado: "Chihuahua" },
  { nombre: "Universidad Autónoma de Chihuahua", siglas: "UACH", estado: "Chihuahua" },
  { nombre: "Universidad Autónoma de Ciudad Juárez", siglas: "UACJ", estado: "Chihuahua" },
  { nombre: "Universidad Tecnológica de Chihuahua", siglas: "UTCH", estado: "Chihuahua" },
  { nombre: "Universidad Tecnológica de Chihuahua Sur", siglas: "UTCH Sur", estado: "Chihuahua" },
  { nombre: "Universidad Politécnica de Chihuahua", siglas: "UPCH", estado: "Chihuahua" },
  { nombre: "Universidad Tecnológica de Parral", siglas: "UTParral", estado: "Chihuahua" },

  // --- Ciudad de México ---
  { nombre: "Centro de Investigación en Ciencias de Información Geoespacial", siglas: "CentroGeo", estado: "Ciudad de México" },
  { nombre: "Centro de Investigación y de Estudios Avanzados del Instituto Politécnico Nacional", siglas: "Cinvestav", estado: "Ciudad de México" },
  { nombre: "Centro de Investigación y Docencia Económicas", siglas: "CIDE", estado: "Ciudad de México" },
  { nombre: "Centro de Investigaciones y Estudios Superiores en Antropología Social", siglas: "CIESAS", estado: "Ciudad de México" },
  { nombre: "El Colegio de México", siglas: "COLMEX", estado: "Ciudad de México" },
  { nombre: "Escuela Nacional de Antropología e Historia", siglas: "ENAH", estado: "Ciudad de México" },
  { nombre: "Facultad Latinoamericana de Ciencias Sociales", siglas: "FLACSO", estado: "Ciudad de México" },
  { nombre: "Instituto de Investigaciones Dr. José María Luis Mora", siglas: "Instituto Mora", estado: "Ciudad de México" },
  { nombre: "Instituto Nacional de Bellas Artes y Literatura", siglas: "INBAL", estado: "Ciudad de México" },
  { nombre: "Instituto Politécnico Nacional", siglas: "IPN", estado: "Ciudad de México" },
  { nombre: "Universidad Autónoma de la Ciudad de México", siglas: "UACM", estado: "Ciudad de México" },
  { nombre: "Universidad Autónoma Metropolitana", siglas: "UAM", estado: "Ciudad de México" },
  { nombre: "Universidad Nacional Autónoma de México", siglas: "UNAM", estado: "Ciudad de México" },
  { nombre: "Universidad Pedagógica Nacional", siglas: "UPN", estado: "Ciudad de México" },
  { nombre: "Escuela Nacional de Conservación, Restauración y Museografía Manuel del Castillo Negrete", siglas: "ENCRyM", estado: "Ciudad de México" },
  { nombre: "Universidad Nacional Rosario Castellanos", siglas: "UNRC", estado: "Ciudad de México" },

  // --- Coahuila ---
  { nombre: "Universidad Autónoma Agraria Antonio Narro", siglas: "UAAAN", estado: "Coahuila" },
  { nombre: "Universidad Autónoma de Coahuila", siglas: "UAdeC", estado: "Coahuila" },
  { nombre: "Universidad Tecnológica de Coahuila", siglas: "UTC", estado: "Coahuila" },

  // --- Colima ---
  { nombre: "Universidad de Colima", siglas: "UCOL", estado: "Colima" },

  // --- Durango ---
  { nombre: "Universidad Juárez del Estado de Durango", siglas: "UJED", estado: "Durango" },
  { nombre: "Universidad Politécnica Gómez Palacio", siglas: "UPGOP", estado: "Durango" },

  // --- Estado de México ---
  { nombre: "Colegio de Postgraduados", siglas: "COLPOS", estado: "Estado de México" },
  { nombre: "Escuela Judicial del Estado de México", siglas: "EJEM", estado: "Estado de México" },
  { nombre: "Tecnológico de Estudios Superiores de Ecatepec", siglas: "TESE", estado: "Estado de México" },
  { nombre: "Universidad Autónoma Chapingo", siglas: "UACh", estado: "Estado de México" },
  { nombre: "Universidad Autónoma del Estado de México", siglas: "UAEMéx", estado: "Estado de México" },
  { nombre: "Universidad Estatal del Valle de Ecatepec", siglas: "UNEVE", estado: "Estado de México" },
  { nombre: "Universidad Politécnica del Valle de México", siglas: "UPVM", estado: "Estado de México" },
  { nombre: "Universidad Tecnológica de Nezahualcóyotl", siglas: "UTN", estado: "Estado de México" },
  { nombre: "Universidad Tecnológica de Tecámac", siglas: "UTTEC", estado: "Estado de México" },
  { nombre: "Universidad Tecnológica del Valle de Toluca", siglas: "UTVT", estado: "Estado de México" },
  { nombre: "Universidad Tecnológica Fidel Velázquez", siglas: "UTFV", estado: "Estado de México" },
  { nombre: "Escuela Normal de Jilotepec", siglas: "EN Jilotepec", estado: "Estado de México" },
  { nombre: "Escuela Normal de Teotihuacán", siglas: "EN Teotihuacán", estado: "Estado de México" },
  { nombre: "Escuela Normal de Texcoco", siglas: "EN Texcoco", estado: "Estado de México" },
  { nombre: "Escuela Normal de Tlalnepantla", siglas: "EN Tlalnepantla", estado: "Estado de México" },
  { nombre: "Escuela Normal de Zumpango", siglas: "EN Zumpango", estado: "Estado de México" },
  { nombre: "Escuela Normal No. 1 de Toluca", siglas: "EN 1 Toluca", estado: "Estado de México" },
  { nombre: "Escuela Normal No. 3 de Nezahualcóyotl", siglas: "EN 3 Nezahualcóyotl", estado: "Estado de México" },
  { nombre: "Escuela Normal de Tenancingo", siglas: "EN Tenancingo", estado: "Estado de México" },
  { nombre: "Universidad Politécnica de Atlautla", siglas: "UPAtlautla", estado: "Estado de México" },
  { nombre: "Universidad Politécnica del Valle de Toluca", siglas: "UPVT", estado: "Estado de México" },
  { nombre: "Universidad Estatal del Valle de Toluca", siglas: "UNEVT", estado: "Estado de México" },
  { nombre: "Escuela Normal de Los Reyes Acaquilpan", siglas: "EN Los Reyes", estado: "Estado de México" },
  { nombre: "Escuela Normal de Atizapán de Zaragoza", siglas: "EN Atizapán", estado: "Estado de México" },
  { nombre: "UPN Unidad 152 Atizapán de Zaragoza", siglas: "UPN 152", estado: "Estado de México" },
  { nombre: "Escuela Normal de Ixtlahuaca", siglas: "EN Ixtlahuaca", estado: "Estado de México" },
  { nombre: "Escuela Normal No. 3 de Toluca", siglas: "EN 3 Toluca", estado: "Estado de México" },
  { nombre: "Centenaria y Benemérita Escuela Normal para Profesores", siglas: "CBENP", estado: "Estado de México" },

  // --- Guanajuato ---
  { nombre: "Centro de Investigaciones en Óptica", siglas: "CIO", estado: "Guanajuato" },
  { nombre: "Universidad de Guanajuato", siglas: "UG", estado: "Guanajuato" },
  { nombre: "Universidad Tecnológica de León", siglas: "UTL", estado: "Guanajuato" },
  { nombre: "Universidad Tecnológica del Suroeste de Guanajuato", siglas: "UTSOE", estado: "Guanajuato" },
  { nombre: "Universidad Virtual del Estado de Guanajuato", siglas: "UVEG", estado: "Guanajuato" },
  { nombre: "Universidad Politécnica de Juventino Rosas", siglas: "UPJR", estado: "Guanajuato" },
  { nombre: "UPN Unidad 111 Guanajuato", siglas: "UPN 111", estado: "Guanajuato" },

  // --- Guerrero ---
  { nombre: "Universidad Autónoma de Guerrero", siglas: "UAGro", estado: "Guerrero" },

  // --- Hidalgo ---
  { nombre: "Universidad Autónoma del Estado de Hidalgo", siglas: "UAEH", estado: "Hidalgo" },
  { nombre: "Universidad Politécnica de Tulancingo", siglas: "UPT", estado: "Hidalgo" },
  { nombre: "Universidad Politécnica Metropolitana de Hidalgo", siglas: "UPMH", estado: "Hidalgo" },
  { nombre: "Universidad Tecnológica de Tula-Tepeji", siglas: "UTTT", estado: "Hidalgo" },

  // --- Jalisco ---
  { nombre: "Centro de Enseñanza Técnica Industrial", siglas: "CETI", estado: "Jalisco" },
  { nombre: "Universidad de Guadalajara", siglas: "UdeG", estado: "Jalisco" },
  { nombre: "Universidad Tecnológica de Jalisco", siglas: "UTJ", estado: "Jalisco" },

  // --- Michoacán ---
  { nombre: "El Colegio de Michoacán", siglas: "COLMICH", estado: "Michoacán" },
  { nombre: "Universidad Michoacana de San Nicolás de Hidalgo", siglas: "UMSNH", estado: "Michoacán" },

  // --- Morelos ---
  { nombre: "Centro Nacional de Investigación y Desarrollo Tecnológico", siglas: "CENIDET", estado: "Morelos" },
  { nombre: "Instituto Nacional de Salud Pública", siglas: "INSP", estado: "Morelos" },
  { nombre: "Universidad Autónoma del Estado de Morelos", siglas: "UAEM", estado: "Morelos" },
  { nombre: "Universidad Tecnológica Emiliano Zapata del Estado de Morelos", siglas: "UTEZ", estado: "Morelos" },

  // --- Nayarit ---
  { nombre: "Universidad Autónoma de Nayarit", siglas: "UAN", estado: "Nayarit" },
  { nombre: "Universidad Tecnológica de Nayarit", siglas: "UTNAY", estado: "Nayarit" },

  // --- Nuevo León ---
  { nombre: "Universidad Autónoma de Nuevo León", siglas: "UANL", estado: "Nuevo León" },

  // --- Oaxaca ---
  { nombre: "Universidad Autónoma Benito Juárez de Oaxaca", siglas: "UABJO", estado: "Oaxaca" },
  { nombre: "Universidad de la Sierra Juárez", siglas: "UNSIJ", estado: "Oaxaca" },
  { nombre: "Universidad de la Sierra Sur", siglas: "UNSIS", estado: "Oaxaca" },
  { nombre: "Universidad Tecnológica de la Mixteca", siglas: "UTM", estado: "Oaxaca" },
  { nombre: "Universidad del Istmo", siglas: "UNISTMO", estado: "Oaxaca" },
  { nombre: "Universidad del Papaloapan", siglas: "UNPA", estado: "Oaxaca" },
  { nombre: "Universidad del Mar", siglas: "UMAR", estado: "Oaxaca" },
  { nombre: "Universidad de La Cañada", siglas: "UNCA", estado: "Oaxaca" },
  { nombre: "Universidad de Chalcatongo", siglas: "UNICHA", estado: "Oaxaca" },

  // --- Puebla ---
  { nombre: "Benemérita Universidad Autónoma de Puebla", siglas: "BUAP", estado: "Puebla" },
  { nombre: "Escuela Normal Superior Federalizada del Estado de Puebla", siglas: "ENSFEP", estado: "Puebla" },
  { nombre: "Instituto Nacional de Astrofísica, Óptica y Electrónica", siglas: "INAOE", estado: "Puebla" },
  { nombre: "Universidad Tecnológica de Huejotzingo", siglas: "UTH", estado: "Puebla" },
  { nombre: "Universidad Tecnológica de Puebla", siglas: "UTP", estado: "Puebla" },
  { nombre: "Universidad Tecnológica de Tecamachalco", siglas: "UTTECAM", estado: "Puebla" },
  { nombre: "Universidad Tecnológica de Tehuacán", siglas: "UTTehuacán", estado: "Puebla" },
  { nombre: "Universidad Tecnológica de Xicotepec de Juárez", siglas: "UTXJ", estado: "Puebla" },
  { nombre: "Universidad Intercultural del Estado de Puebla", siglas: "UIEP", estado: "Puebla" },

  // --- Querétaro ---
  { nombre: "Centro de Investigación y Desarrollo Tecnológico en Electroquímica", siglas: "CIDETEQ", estado: "Querétaro" },
  { nombre: "Universidad Autónoma de Querétaro", siglas: "UAQ", estado: "Querétaro" },
  { nombre: "Universidad Tecnológica de Querétaro", siglas: "UTEQ", estado: "Querétaro" },
  { nombre: "Universidad Tecnológica de San Juan del Río", siglas: "UTSJR", estado: "Querétaro" },

  // --- Quintana Roo ---
  { nombre: "Universidad Autónoma del Estado de Quintana Roo", siglas: "UQROO", estado: "Quintana Roo" },
  { nombre: "Universidad del Caribe", siglas: "UNICARIBE", estado: "Quintana Roo" },

  // --- San Luis Potosí ---
  { nombre: "Instituto Potosino de Investigación Científica y Tecnológica", siglas: "IPICYT", estado: "San Luis Potosí" },
  { nombre: "Universidad Autónoma de San Luis Potosí", siglas: "UASLP", estado: "San Luis Potosí" },
  { nombre: "Benemérita y Centenaria Escuela Normal del Estado de San Luis Potosí", siglas: "BECENE", estado: "San Luis Potosí" },

  // --- Sinaloa ---
  { nombre: "Universidad Autónoma de Occidente", siglas: "UAdeO", estado: "Sinaloa" },
  { nombre: "Universidad Autónoma de Sinaloa", siglas: "UAS", estado: "Sinaloa" },

  // --- Sonora ---
  { nombre: "Centro de Investigación en Alimentación y Desarrollo", siglas: "CIAD", estado: "Sonora" },
  { nombre: "El Colegio de Sonora", siglas: "COLSON", estado: "Sonora" },
  { nombre: "Instituto Tecnológico de Sonora", siglas: "ITSON", estado: "Sonora" },
  { nombre: "Universidad de Sonora", siglas: "UNISON", estado: "Sonora" },
  { nombre: "Universidad Estatal de Sonora", siglas: "UES", estado: "Sonora" },
  { nombre: "Universidad Tecnológica de Hermosillo", siglas: "UTH Sonora", estado: "Sonora" },
  { nombre: "Universidad Tecnológica del Sur de Sonora", siglas: "UTS", estado: "Sonora" },

  // --- Tabasco ---
  { nombre: "Universidad Juárez Autónoma de Tabasco", siglas: "UJAT", estado: "Tabasco" },

  // --- Tamaulipas ---
  { nombre: "Universidad Autónoma de Tamaulipas", siglas: "UAT", estado: "Tamaulipas" },
  { nombre: "UPN Unidad 285 Reynosa", siglas: "UPN 285", estado: "Tamaulipas" },

  // --- Tlaxcala ---
  { nombre: "Universidad Autónoma de Tlaxcala", siglas: "UATx", estado: "Tlaxcala" },

  // --- Veracruz ---
  { nombre: "Instituto de Ecología", siglas: "INECOL", estado: "Veracruz" },
  { nombre: "Universidad Veracruzana", siglas: "UV", estado: "Veracruz" },
  { nombre: "Universidad Tecnológica de Gutiérrez Zamora", siglas: "UTGZ", estado: "Veracruz" },

  // --- Yucatán ---
  { nombre: "Centro de Investigación Científica de Yucatán", siglas: "CICY", estado: "Yucatán" },
  { nombre: "Universidad Autónoma de Yucatán", siglas: "UADY", estado: "Yucatán" },
  { nombre: "Universidad de Oriente", siglas: "UNO", estado: "Yucatán" },

  // --- Zacatecas ---
  { nombre: "Universidad Autónoma de Zacatecas", siglas: "UAZ", estado: "Zacatecas" },
];
