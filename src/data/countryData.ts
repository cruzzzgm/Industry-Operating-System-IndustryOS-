export interface Country {
  code: string;
  name: string;
  states?: State[];
}

export interface State {
  code: string;
  name: string;
  cities?: string[];
}

export const countries: Country[] = [
  { code: "BR", name: "Brasil", states: [
    { code: "AC", name: "Acre", cities: ["Rio Branco", "Cruzeiro do Sul", "Senador Guiomard"] },
    { code: "AL", name: "Alagoas", cities: ["Maceió", "Arapiraca", "Palmeira dos Índios"] },
    { code: "AP", name: "Amapá", cities: ["Macapá", "Santana", "Oiapoque"] },
    { code: "AM", name: "Amazonas", cities: ["Manaus", "Parintins", "Itacoatiara"] },
    { code: "BA", name: "Bahia", cities: ["Salvador", "Feira de Santana", "Vitória da Conquista"] },
    { code: "CE", name: "Ceará", cities: ["Fortaleza", "Caucaia", "Juazeiro do Norte"] },
    { code: "DF", name: "Distrito Federal", cities: ["Brasília", "Ceilândia", "Planaltina"] },
    { code: "ES", name: "Espírito Santo", cities: ["Vitória", "Serra", "Cachoeiro de Itapemirim"] },
    { code: "GO", name: "Goiás", cities: ["Goiânia", "Anápolis", "Aparecida de Goiânia"] },
    { code: "MA", name: "Maranhão", cities: ["São Luís", "Imperatriz", "Timon"] },
    { code: "MT", name: "Mato Grosso", cities: ["Cuiabá", "Várzea Grande", "Rondonópolis"] },
    { code: "MS", name: "Mato Grosso do Sul", cities: ["Campo Grande", "Dourados", "Três Lagoas"] },
    { code: "MG", name: "Minas Gerais", cities: ["Belo Horizonte", "Uberlândia", "Contagem"] },
    { code: "PA", name: "Pará", cities: ["Belém", "Ananindeua", "Marabá"] },
    { code: "PB", name: "Paraíba", cities: ["João Pessoa", "Campina Grande", "Cajazeiras"] },
    { code: "PR", name: "Paraná", cities: ["Curitiba", "Londrina", "Maringá"] },
    { code: "PE", name: "Pernambuco", cities: ["Recife", "Olinda", "Jaboatão dos Guararapes"] },
    { code: "PI", name: "Piauí", cities: ["Teresina", "Parnaíba", "Picos"] },
    { code: "RJ", name: "Rio de Janeiro", cities: ["Rio de Janeiro", "Niterói", "Duque de Caxias"] },
    { code: "RN", name: "Rio Grande do Norte", cities: ["Natal", "Mossoró", "Parnamirim"] },
    { code: "RS", name: "Rio Grande do Sul", cities: ["Porto Alegre", "Caxias do Sul", "Gravataí"] },
    { code: "RO", name: "Rondônia", cities: ["Porto Velho", "Ji-Paraná", "Ariquemes"] },
    { code: "RR", name: "Roraima", cities: ["Boa Vista", "Rorainópolis", "Caracaraí"] },
    { code: "SC", name: "Santa Catarina", cities: ["Florianópolis", "Joinville", "Blumenau"] },
    { code: "SP", name: "São Paulo", cities: ["São Paulo", "Campinas", "Guarulhos", "Santos", "São Bernardo do Campo", "São José dos Campos"] },
    { code: "SE", name: "Sergipe", cities: ["Aracaju", "Itabaiana", "Lagarto"] },
    { code: "TO", name: "Tocantins", cities: ["Palmas", "Araguaína", "Gurupi"] }
  ]},
  { code: "US", name: "Estados Unidos", states: [
    { code: "CA", name: "Califórnia", cities: ["Los Angeles", "San Francisco", "San Diego", "Sacramento"] },
    { code: "TX", name: "Texas", cities: ["Houston", "Dallas", "Austin", "San Antonio"] },
    { code: "FL", name: "Flórida", cities: ["Miami", "Orlando", "Tampa", "Jacksonville"] },
    { code: "NY", name: "Nova York", cities: ["Nova York", "Buffalo", "Rochester", "Yonkers"] },
    { code: "IL", name: "Illinois", cities: ["Chicago", "Aurora", "Rockford", "Joliet"] },
    { code: "PA", name: "Pensilvânia", cities: ["Filadélfia", "Pittsburgh", "Allentown", "Erie"] }
  ]},
  { code: "AR", name: "Argentina", states: [
    { code: "BA", name: "Buenos Aires", cities: ["Buenos Aires", "La Plata", "Mar del Plata"] },
    { code: "CB", name: "Córdoba", cities: ["Córdoba", "Villa María", "Río Cuarto"] },
    { code: "SF", name: "Santa Fé", cities: ["Santa Fé", "Rosario", "Rafaela"] }
  ]},
  { code: "CL", name: "Chile", states: [
    { code: "RM", name: "Região Metropolitana", cities: ["Santiago", "Puente Alto", "La Florida"] },
    { code: "AN", name: "Antofagasta", cities: ["Antofagasta", "Calama", "Copiapó"] },
    { code: "VS", name: "Valparaíso", cities: ["Valparaíso", "Viña del Mar", "Quilpué"] }
  ]},
  { code: "CO", name: "Colômbia", states: [
    { code: "BOG", name: "Bogotá", cities: ["Bogotá", "Soacha", "Chía"] },
    { code: "ANT", name: "Antioquia", cities: ["Medellín", "Envigado", "Bello"] },
    { code: "VAL", name: "Valle del Cauca", cities: ["Cali", "Palmira", "Buenaventura"] }
  ]},
  { code: "PE", name: "Peru", states: [
    { code: "LIM", name: "Lima", cities: ["Lima", "Callao", "Miraflores"] },
    { code: "ARE", name: "Arequipa", cities: ["Arequipa", "Caylloma", "Camaná"] },
    { code: "CUS", name: "Cusco", cities: ["Cusco", "Sicuani", "Urubamba"] }
  ]},
  { code: "UY", name: "Uruguai", states: [
    { code: "MO", name: "Montevideo", cities: ["Montevideo", "Canelones", "Pando"] },
    { code: "CA", name: "Canelones", cities: ["Canelones", "Minas", "Sarandí del Yí"] }
  ]},
  { code: "PY", name: "Paraguai", states: [
    { code: "ASU", name: "Asunción", cities: ["Asunción", "Luque", "San Lorenzo"] },
    { code: "CEN", name: "Central", cities: ["Ciudad del Este", "Coronel Oviedo", "Villarrica"] }
  ]},
  { code: "MX", name: "México", states: [
    { code: "CMX", name: "Cidade do México", cities: ["Cidade do México", "Ecatepec", "Naucalpan"] },
    { code: "JAL", name: "Jalisco", cities: ["Guadalajara", "Zapopan", "Puerto Vallarta"] },
    { code: "NL", name: "Nuevo León", cities: ["Monterrey", "Apodaca", "San Nicolás"] }
  ]},
  { code: "ES", name: "Espanha", states: [
    { code: "M", name: "Madri", cities: ["Madri", "Alcalá de Henares", "Mostoles"] },
    { code: "CT", name: "Catalunha", cities: ["Barcelona", "Tarragona", "Lérida"] },
    { code: "AN", name: "Andaluzia", cities: ["Sevilha", "Málaga", "Granada"] }
  ]},
  { code: "PT", name: "Portugal", states: [
    { code: "LIS", name: "Lisboa", cities: ["Lisboa", "Cascais", "Sintra"] },
    { code: "POR", name: "Porto", cities: ["Porto", "Gaia", "Matosinhos"] },
    { code: "FAR", name: "Faro", cities: ["Faro", "Olhão", "Tavira"] }
  ]},
  { code: "FR", name: "França", states: [
    { code: "IDF", name: "Ilha de França", cities: ["Paris", "Versalhes", "Boulogne-Billancourt"] },
    { code: "ARA", name: "Auvérnia-Ródano-Alpes", cities: ["Lyon", "Grenoble", "Saint-Étienne"] },
    { code: "PAC", name: "Provença-Alpes-Costa Azul", cities: ["Marselha", "Nice", "Toulon"] }
  ]},
  { code: "DE", name: "Alemanha", states: [
    { code: "BE", name: "Berlim", cities: ["Berlim", "Potsdam", "Frankfurt an der Oder"] },
    { code: "BY", name: "Baviera", cities: ["Munique", "Nuremberga", "Augsburgo"] },
    { code: "NW", name: "Renânia do Norte-Vestfália", cities: ["Colônia", "Düsseldorf", "Dortmund"] }
  ]},
  { code: "IT", name: "Itália", states: [
    { code: "RM", name: "Lácio", cities: ["Roma", "Latina", "Frosinone"] },
    { code: "LOM", name: "Lombardia", cities: ["Milão", "Bérgamo", "Brescia"] },
    { code: "VE", name: "Vêneto", cities: ["Veneza", "Verona", "Pádua"] }
  ]},
  { code: "GB", name: "Reino Unido", states: [
    { code: "ENG", name: "Inglaterra", cities: ["Londres", "Manchester", "Birmingham"] },
    { code: "SCT", name: "Escócia", cities: ["Edimburgo", "Glasgow", "Aberdeen"] },
    { code: "WLS", name: "País de Gales", cities: ["Cardiff", "Swansea", "Newport"] }
  ]},
  { code: "CA", name: "Canadá", states: [
    { code: "ON", name: "Ontário", cities: ["Toronto", "Ottawa", "Hamilton"] },
    { code: "QC", name: "Quebec", cities: ["Montreal", "Quebec City", "Laval"] },
    { code: "BC", name: "Colúmbia Britânica", cities: ["Vancouver", "Victoria", "Surrey"] }
  ]},
  { code: "AU", name: "Austrália", states: [
    { code: "NSW", name: "Nova Gales do Sul", cities: ["Sydney", "Newcastle", "Wollongong"] },
    { code: "VIC", name: "Victoria", cities: ["Melbourne", "Geelong", "Ballarat"] },
    { code: "QLD", name: "Queensland", cities: ["Brisbane", "Gold Coast", "Cairns"] }
  ]},
  { code: "JP", name: "Japão", states: [
    { code: "13", name: "Tóquio", cities: ["Tóquio", "Yokohama", "Chiba"] },
    { code: "27", name: "Osaka", cities: ["Osaka", "Sakai", "Kobe"] },
    { code: "23", name: "Aichi", cities: ["Nagoia", "Toyohashi", "Ichinomiya"] }
  ]},
  { code: "CN", name: "China", states: [
    { code: "BJ", name: "Pequim", cities: ["Pequim", "Tianjin", "Shanghai"] },
    { code: "GD", name: "Guangdong", cities: ["Guangzhou", "Shenzhen", "Dongguan"] },
    { code: "SH", name: "Xangai", cities: ["Shanghai", "Suzhou", "Nanjing"] }
  ]},
  { code: "IN", name: "Índia", states: [
    { code: "MH", name: "Maharashtra", cities: ["Mumbai", "Pune", "Nagpur"] },
    { code: "DL", name: "Delhi", cities: ["Nova Delhi", "Gurgaon", "Noida"] },
    { code: "KA", name: "Karnataka", cities: ["Bangalore", "Mysore", "Hubli-Dharwad"] }
  ]},
  { code: "RU", name: "Rússia", states: [
    { code: "MOW", name: "Moscou", cities: ["Moscou", "Khimki", "Podolsk"] },
    { code: "SPE", name: "São Petersburgo", cities: ["São Petersburgo", "Pushkin", "Krasnoe Selo"] },
    { code: "YEV", name: "Ecaterimburgo", cities: ["Ecaterimburgo", "Ural", "Kamensk-Uralsky"] }
  ]},
  { code: "ZA", name: "África do Sul", states: [
    { code: "GP", name: "Gauteng", cities: ["Joanesburgo", "Pretória", "Soweto"] },
    { code: "WC", name: "Cabo Ocidental", cities: ["Cidade do Cabo", "Stellenbosch", "Worcester"] },
    { code: "KZN", name: "KwaZulu-Natal", cities: ["Durban", "Pietermaritzburg", "Ulundi"] }
  ]}
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(country => country.code === code);
}

export function getStatesByCountryCode(countryCode: string): State[] {
  const country = getCountryByCode(countryCode);
  return country?.states || [];
}

export function getCitiesByState(countryCode: string, stateCode: string): string[] {
  const country = getCountryByCode(countryCode);
  const state = country?.states?.find(state => state.code === stateCode);
  return state?.cities || [];
}
