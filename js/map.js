const CONFIG = window.MAPID_CONFIG || {
   basemaps: {

    street: {
      url: "https://basemap.mapid.io/styles/street-2d-building/?key=6a800369610fe054a12df079&vector#5/-0.79/113.92",
      options: {}
    },

    satellite: {
      url: "https://basemap.mapid.io/styles/satellite/512/{z}/{x}/{y}.png?key=6a800369610fe054a12df079",
      options: {}
    },

    light: {
      url: "https://basemap.mapid.io/styles/light/512/{z}/{x}/{y}.png?key=6a800369610fe054a12df079",
      options: {}
    }

  },

  layers: {
    transport: { enabled: false, url: "" },
    hotel: { enabled: false, url: "" },
    tourism: { enabled: false, url: "" },
    coffee: { enabled: false, url: "" }
  },

  isochrone: {
    provider: "ors",
    orsApiKey: "",
    orsUrl: "https://api.openrouteservice.org/v2/isochrones"
  }
};



/* ==============================================================================================
   MAP
=============================================================================================== */

const map = L.map("map", {
  zoomControl: true,
  attributionControl: true
}).setView([-6.9080, 107.6700], 12);


const streetMap = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }
);


const darkMap = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap & CARTO"
  }
);


const satelliteMap = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri"
  }
);


streetMap.addTo(map);



/* ==============================================================================================
   MAP LAYERS
=============================================================================================== */

const tourismLayer = L.markerClusterGroup({
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  spiderfyOnMaxZoom: true,
  disableClusteringAtZoom: 15,
  maxClusterRadius: 50
}).addTo(map);


const hotelLayer = L.markerClusterGroup({
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  spiderfyOnMaxZoom: true,
  disableClusteringAtZoom: 15,
  maxClusterRadius: 50
});


const transportLayer = L.markerClusterGroup({
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  spiderfyOnMaxZoom: true,
  disableClusteringAtZoom: 15,
  maxClusterRadius: 50
});


const adminLayer = L.layerGroup();



/* ==============================================================================================
   DATA
=============================================================================================== */

let places = [];

let tourismMarkers = [];

let hotelMarkers = [];

let transportMarkers = [];

let allMarkers = [];

let currentFilteredTourism = [];



/* ==============================================================================================
   HELPERS
=============================================================================================== */

const $ = id => document.getElementById(id);


const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));



/* ==============================================================================================
   NORMALISASI FIELD
=============================================================================================== */

/* ---------- NORMALISASI NAMA FIELD ---------- */

function normalizeFieldName(value) {

  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]/g, "");

}


/* ---------- AMBIL NILAI FIELD ---------- */

function firstValue(obj, keys, fallback = "") {

  if (!obj) return fallback;


  for (const key of keys) {

    if (
      obj[key] !== undefined &&
      obj[key] !== null &&
      obj[key] !== ""
    ) {
      return obj[key];
    }

  }


  const normalizedKeys =
    keys.map(normalizeFieldName);


  for (const actualKey of Object.keys(obj)) {

    const normalizedActual =
      normalizeFieldName(actualKey);


    if (
      normalizedKeys.includes(normalizedActual) &&
      obj[actualKey] !== undefined &&
      obj[actualKey] !== null &&
      obj[actualKey] !== ""
    ) {
      return obj[actualKey];
    }

  }


  return fallback;

}



/* ==============================================================================================
   TIPE WISATA
=============================================================================================== */

/* ---------- AMBIL TIPE WISATA ---------- */

function getTourismType(properties) {

  const value = firstValue(
    properties,
    [
      "TIPE_2",
      "Tipe 2",
      "tipe_2",
      "tipe2"
    ],
    ""
  );


  return String(value || "").trim();

}



/* ==============================================================================================
   EXTRACT FEATURES MAPID
=============================================================================================== */

/* ---------- AMBIL FEATURES MAPID ---------- */

function extractFeatures(payload) {

  if (!payload) return [];


  if (
    payload.type === "FeatureCollection" &&
    Array.isArray(payload.features)
  ) {
    return payload.features;
  }


  if (Array.isArray(payload)) {
    return payload;
  }


  if (Array.isArray(payload.features)) {
    return payload.features;
  }


  if (Array.isArray(payload.data)) {
    return payload.data;
  }


  if (
    payload.data &&
    payload.data.type === "FeatureCollection" &&
    Array.isArray(payload.data.features)
  ) {
    return payload.data.features;
  }


  if (
    payload.data &&
    Array.isArray(payload.data.features)
  ) {
    return payload.data.features;
  }


  if (Array.isArray(payload.results)) {
    return payload.results;
  }


  return [];

}



/* ==============================================================================================
   NORMALISASI KOORDINAT
=============================================================================================== */

/* ---------- AMBIL KOORDINAT ---------- */

function getCoordinates(item) {

  const p = item.properties || item;

  const geom = item.geometry || {};


  let lng = firstValue(
    p,
    [
      "lng",
      "lon",
      "longitude",
      "Longitude",
      "LONGITUDE",
      "x",
      "X"
    ]
  );


  let lat = firstValue(
    p,
    [
      "lat",
      "latitude",
      "Latitude",
      "LATITUDE",
      "y",
      "Y"
    ]
  );


  if (
    geom.type === "Point" &&
    Array.isArray(geom.coordinates)
  ) {

    lng = geom.coordinates[0];
    lat = geom.coordinates[1];

  }


  lat = Number(lat);
  lng = Number(lng);


  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }


  return {
    lat,
    lng
  };

}



/* ==============================================================================================
   NORMALISASI DATA TEMPAT
=============================================================================================== */

/* ---------- BENTUK DATA TEMPAT ---------- */

function normalizePlace(item, sourceCategory) {

  const p = item.properties || item;

  const coords = getCoordinates(item);


  if (!coords) {
    return null;
  }


  const tourismType =
    sourceCategory === "Wisata"
      ? getTourismType(p)
      : "";


  const displayCategory =
    sourceCategory === "Wisata"
      ? (tourismType || "Wisata")
      : sourceCategory;


  return {

    id: firstValue(
      p,
      [
        "id",
        "ID",
        "Id",
        "objectid",
        "OBJECTID",
        "uuid"
      ],
      `${coords.lat},${coords.lng},${sourceCategory}`
    ),


    name: firstValue(
      p,
      [
        "name",
        "nama",
        "Nama",
        "NAMA",
        "title",
        "judul",
        "place_name",
        "nama_tempat"
      ],
      "Tanpa Nama"
    ),


    category: displayCategory,

    sourceCategory: sourceCategory,

    tourismType: tourismType,

    tipe2: firstValue(
      p,
      [
        "tipe_2",
        "Tipe_2",
        "TIPE_2",
        "Tipe 2",
        "tipe2"
      ],
      ""
    ),

    tipe3: firstValue(
      p,
      [
        "tipe_3",
        "Tipe_3",
        "TIPE_3",
        "Tipe 3",
        "tipe3"
      ],
      ""
    ),

    rating: Number(
      firstValue(
        p,
        [
          "rating",
          "Rating",
          "RATING",
          "rate",
          "score"
        ],
        0
      )
    ) || 0,


    reviews: Number(
      firstValue(
        p,
        [
          "reviews",
          "review_count",
          "ulasan",
          "jumlah_ulasan"
        ],
        0
      )
    ) || 0,


    popularity: firstValue(
      p,
      [
        "popularity",
        "popularitas",
        "populer"
      ],
      ""
    ),


    address: firstValue(
      p,
      [
        "address",
        "alamat",
        "Alamat",
        "ALAMAT",
        "full_address"
      ],
      ""
    ),


    region: firstValue(
      p,
      [
        "region",
        "wilayah",
        "kecamatan",
        "city",
        "kota"
      ],
      ""
    ),


    description: firstValue(
      p,
      [
        "description",
        "deskripsi",
        "Description",
        "summary"
      ],
      ""
    ),


    photo: firstValue(
      p,
      [
        "photo",
        "foto",
        "image",
        "gambar",
        "thumbnail",
        "image_url"
      ],
      ""
    ),


    googlePlaceId: firstValue(
      p,
      [
        "google_place_id",
        "googlePlaceId",
        "place_id",
        "google_maps_place_id"
      ],
      ""
    ),


    lat: coords.lat,

    lng: coords.lng

  };

}



/* ==============================================================================================
   LOAD LAYER MAPID
=============================================================================================== */

/* ---------- LOAD LAYER MAPID ---------- */

async function loadLayer(layerName, categoryName) {

  const source = CONFIG.layers?.[layerName];

  if (!source?.enabled || !source?.url) {
    return [];
  }

  const allFeatures = [];
  const limit = 200;
  let skip = 0;

  while (true) {

    const separator = source.url.includes("?")
      ? "&"
      : "?";

    const url =
      `${source.url}${separator}limit=${limit}&skip=${skip}`;

    const response = await fetch(url, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil data ${layerName}: ${response.status}`
      );
    }

    const payload = await response.json();

    const features = extractFeatures(payload);

    if (!features.length) {
      break;
    }

    allFeatures.push(...features);

    if (features.length < limit) {
      break;
    }

    skip += limit;
  }

  const loaded = allFeatures
    .map(
      item =>
        normalizePlace(
          item,
          categoryName
        )
    )
    .filter(Boolean);

  console.log(
    `${layerName}: ${loaded.length} data berhasil dimuat`
  );

  return loaded;
}



/* ==============================================================================================
   LOAD SEMUA DATA
=============================================================================================== */

/* ---------- LOAD SEMUA DATA ---------- */

async function loadPlaces() {

  showToast("Memuat Data Dari MAPID...");

    const results = await Promise.all([

      loadLayer(
        "tourism",
        "Wisata"
      ),

      loadLayer(
        "coffee",
        "Coffee Shop"
      ),

      loadLayer(
        "coffee2",
        "Coffee Shop"
      ),

      loadLayer(
        "hotel",
        "Hotel"
      ),

      loadLayer(
        "transport",
        "Transport"
      ),

      loadLayer(
          "culinary",
          "Kuliner"
      )
    ]);


  const tourismData = results[0];

  const coffeeData1 = results[1];
  const coffeeData2 = results[2];

  const coffeeData = [
      ...coffeeData1,
      ...coffeeData2
  ];

  const hotelData = results[3];
  const transportData = results[4];
  const culinaryData = results[5];


  places = [

    ...tourismData,

    ...coffeeData,

    ...culinaryData,

    ...hotelData,

    ...transportData

  ];


  const tourismSummary =
    tourismData.reduce(
      (result, place) => {

        const type =
          place.tourismType || "Wisata Lainnya";


        result[type] =
          (result[type] || 0) + 1;


        return result;

      },
      {}
    );


  console.log("=================================");
  console.log("DATA MAPID BERHASIL DIMUAT");
  console.log("WISATA TOTAL:", tourismData.length);
  console.log("RINCIAN WISATA:", tourismSummary);
  console.log("Coffee Shop:", coffeeData.length);
  console.log("Hotel:", hotelData.length);
  console.log("Transport:", transportData.length);
  console.log("TOTAL:", places.length);
  console.log("=================================");


  if (!places.length) {

    showToast(
      "Tidak Ada Data yang Berhasil Dimuat Dari MAPID"
    );

    return;

  }


  showToast(
    `${places.length} Titik Berhasil Dimuat Dari MAPID`
  );

}



/* ==============================================================================================
   TIPE MARKER
=============================================================================================== */

/* ---------- NORMALISASI KATEGORI ---------- */

function normalizeCategoryText(value) {

  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

}


/* ---------- TENTUKAN KELOMPOK KATEGORI ---------- */

function getCategoryGroup(place) {

  const source = normalizeCategoryText(place.sourceCategory);

  if (source === "wisata") return "tourism";

  if (source.includes("coffee") || source.includes("cafe")) return "coffee";

  if (source.includes("kuliner") || source.includes("culinary")) return "culinary";

  if (source.includes("hotel") || source.includes("penginapan")) return "hotel";

  if (source.includes("transport")) return "transport";

  return "other";

}


/* ---------- NORMALISASI LABEL KATEGORI ---------- */

function canonicalCategoryLabel(group, rawLabel) {

  const raw = String(rawLabel || "").trim();
  const key = normalizeCategoryText(raw).replace(/[^a-z0-9]+/g, "");

  if (group === "coffee") {
    // COFFEESHOP / COFFEE SHOP = satu kategori Coffee Shop.
    if (key === "coffeeshop") return "Coffee Shop";
    if (key === "cafe" || key === "cafes") return "Cafe";
  }

  if (group === "culinary") {
    if (key === "restaurant" || key === "restoran") return "Restaurant";
    if (key === "fastfoodrestaurant" || key === "fastfoodrestoran") return "Fast Food Restaurant";
    if (key === "bakery" || key === "toko roti".replace(/[^a-z0-9]+/g, "")) return "Bakery";
    if (key === "foodcourt") return "Food Court";
  }

  return raw || "Lainnya";

}


/* ---------- AMBIL LABEL KATEGORI ---------- */

function getCategoryLabel(place) {

  const group = getCategoryGroup(place);

  if (group === "tourism") {
    return canonicalCategoryLabel(
      group,
      place.tipe2 || place.tourismType || place.category || "Wisata Lainnya"
    );
  }

  if (group === "coffee" || group === "culinary") {
    return canonicalCategoryLabel(
      group,
      place.tipe3 || place.category || "Lainnya"
    );
  }

  if (group === "hotel") return "Hotel & Penginapan";

  if (group === "transport") return String(place.tipe2 || place.category || "Transportasi").trim();

  return String(place.category || "Lainnya").trim() || "Lainnya";

}

const CATEGORY_PALETTE = [
  "#7d4b91",
  "#f2a900",
  "#9b6b2e",
  "#d9783a",
  "#f47a1f",
  "#c85d2e",
  "#7c5a3a",
  "#b56b35",
  "#5f7f4f",
  "#477d8a"
];


/* ---------- HASH KATEGORI ---------- */

function categoryHash(value) {

  let hash = 0;

  const text = String(value || "");

  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);

}


/* ---------- TENTUKAN VISUAL KATEGORI ---------- */

function getCategoryVisual(place) {

  const group = getCategoryGroup(place);
  const label = getCategoryLabel(place);
  const key = `${group}:${normalizeCategoryText(label)}`;

  const exact = {
    "tourism:wisata budaya": {
      className: "marker-culture",
      color: "#7d4b91",
      icon: "fa-solid fa-landmark"
    },
    "tourism:wisata alam": {
      className: "marker-nature",
      color: "#f2a900",
      icon: "fa-solid fa-mountain-sun"
    },
    "coffee:coffee shop": {
      className: "marker-coffee",
      color: "#9b6b2e",
      icon: "fa-solid fa-mug-hot"
    },
    "coffee:cafe": {
      className: "marker-cafe",
      color: "#d9783a",
      icon: "fa-solid fa-shop"
    },
    "culinary:restaurant": {
      className: "marker-restaurant",
      color: "#f47a1f",
      icon: "fa-solid fa-utensils"
    },
    "culinary:fast food restaurant": {
      className: "marker-fastfood",
      color: "#e05a33",
      icon: "fa-solid fa-burger"
    },
    "culinary:bakery": {
      className: "marker-bakery",
      color: "#c48a3a",
      icon: "fa-solid fa-bread-slice"
    },
    "culinary:food court": {
      className: "marker-foodcourt",
      color: "#7c5a3a",
      icon: "fa-solid fa-store"
    },
    "hotel:hotel": {
      className: "marker-hotel",
      color: "#4f9187",
      icon: "fa-solid fa-bed"
    },
    "transport:transport": {
      className: "marker-transport",
      color: "#6b6b6b",
      icon: "fa-solid fa-bus"
    }
  };

  if (exact[key]) return exact[key];

  const lower = normalizeCategoryText(label);

  let icon = "fa-solid fa-location-dot";
  if (group === "tourism") icon = "fa-solid fa-location-dot";
  if (group === "coffee") icon = "fa-solid fa-mug-hot";
  if (group === "culinary") icon = "fa-solid fa-utensils";
  if (group === "hotel") icon = "fa-solid fa-bed";
  if (group === "transport") icon = "fa-solid fa-bus";

  if (lower.includes("alam") || lower.includes("nature")) icon = "fa-solid fa-mountain-sun";
  if (lower.includes("budaya") || lower.includes("cultural")) icon = "fa-solid fa-landmark";
  if (lower.includes("religi") || lower.includes("religious")) icon = "fa-solid fa-place-of-worship";
  if (lower.includes("edukasi") || lower.includes("education")) icon = "fa-solid fa-graduation-cap";
  if (lower.includes("restaurant") || lower.includes("restoran")) icon = "fa-solid fa-utensils";
  if (lower.includes("bakery") || lower.includes("roti")) icon = "fa-solid fa-bread-slice";
  if (lower.includes("dessert") || lower.includes("cake")) icon = "fa-solid fa-cake-candles";
  if (lower.includes("bar")) icon = "fa-solid fa-martini-glass";

  if (group === "hotel") {
    return { className: "marker-hotel", color: "#4f9187", icon: "fa-solid fa-bed" };
  }

  if (group === "transport") {
    return { className: "marker-transport", color: "#6b6b6b", icon: "fa-solid fa-bus" };
  }

  const color = CATEGORY_PALETTE[categoryHash(key) % CATEGORY_PALETTE.length];

  return {
    className: `marker-dynamic-${categoryHash(key)}`,
    color,
    icon
  };

}


/* ---------- TENTUKAN TIPE MARKER ---------- */


function getMarkerType(place) {
  return getCategoryVisual(place).className;
}


/* ---------- BUAT ICON MARKER ---------- */


function createMarkerIcon(type, place = null) {

  const visual = place
    ? getCategoryVisual(place)
    : {
        className: type || "marker-tourism",
        color: "#627552",
        icon: "fa-solid fa-location-dot"
      };

  return L.divIcon({

    className: "custom-marker-wrapper",

    html: `
      <div class="custom-marker ${visual.className}" style="--marker-color:${visual.color}">
        <i class="${visual.icon}"></i>
      </div>
    `,

    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -45]

  });

}



/* ==============================================================================================
   GOOGLE MAPS URL
=============================================================================================== */

/* ---------- BUAT URL GOOGLE MAPS ---------- */

function googleMapsUrl(place) {

  if (place.googlePlaceId) {

    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(
      place.googlePlaceId
    )}`;

  }


  const queryParts = [
    place.name,
    place.address,
    place.region
  ].filter(Boolean);


  const query = queryParts.join(", ");


  if (query) {

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query
    )}`;

  }


  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.lat},${place.lng}`
  )}`;

}



/* ==============================================================================================
   POPUP CATEGORY
=============================================================================================== */

/* ---------- TENTUKAN KATEGORI POPUP ---------- */

function getPopupCategory(place) {

  const sourceCategory =
    String(place.sourceCategory || "")
      .toLowerCase()
      .trim();

  if (
    sourceCategory.includes("hotel") ||
    sourceCategory.includes("penginapan")
  ) {
    return place.tipe2 || place.category || "Hotel";
  }

  if (
    sourceCategory.includes("kuliner") ||
    sourceCategory.includes("culinary")
  ) {
    return place.tipe3 || place.category || "Kuliner";
  }

  if (
    sourceCategory.includes("coffee") ||
    sourceCategory.includes("cafe")
  ) {
    return place.tipe3 || place.category || "Coffee Shop & Cafe";
  }

  return place.category || "";
}



/* ==============================================================================================
   POPUP
=============================================================================================== */

/* ---------- BUAT HTML POPUP ---------- */

function popupHtml(place) {

  const photo = place.photo
    ? `
      <img
        class="popup-photo"
        src="${esc(place.photo)}"
        alt="${esc(place.name)}"
      >
    `
    : "";


  const popularity = place.popularity
    ? `
      <span class="popup-popularity">
        Popularitas: ${esc(place.popularity)}
      </span>
    `
    : "";


  return `

    <div class="place-popup">

      ${photo}

      <div class="popup-category">
        ${esc(getPopupCategory(place))}
      </div>

      <div class="popup-title">
        ${esc(place.name)}
      </div>

      ${popularity}

      ${
        place.address
          ? `
            <div class="popup-row">
              <b>Alamat</b>
              <span>${esc(place.address)}</span>
            </div>
          `
          : ""
      }

      ${
        place.region
          ? `
            <div class="popup-row">
              <b>Wilayah</b>
              <span>${esc(place.region)}</span>
            </div>
          `
          : ""
      }

      ${
        place.description
          ? `
            <div class="popup-description">
              ${esc(place.description)}
            </div>
          `
          : ""
      }

      <div class="popup-actions">

        <a
          href="${googleMapsUrl(place)}"
          target="_blank"
          rel="noopener"
        >
          Google Maps
        </a>

        <button
          type="button"
          class="popup-buffer-btn"
          data-place-id="${esc(place.id)}"
        >
          Analisis Buffer
        </button>

      </div>

    </div>

  `;

}



/* ==============================================================================================
   ADD MARKER
=============================================================================================== */

/* ---------- BUAT MARKER TEMPAT ---------- */

function addPlaceMarker(place) {

  const type = getMarkerType(place);


  const marker = L.marker(
    [place.lat, place.lng],
    {
      icon: createMarkerIcon(type, place)
    }
  );


  marker.placeData = place;


  marker.bindPopup(
    popupHtml(place),
    {
      maxWidth: 320,
      minWidth: 250,
      className: "place-popup-wrap"
    }
  );


  marker.on("click", () => {

    if (bufferPickMode) {

      setBufferPoint(
        place.lat,
        place.lng,
        place
      );

    }


    if (isoPickMode) {

      setIsoPoint(
        place.lat,
        place.lng,
        place
      );

    }

  });


  marker.on("popupopen", () => {

    document
      .querySelectorAll(".popup-buffer-btn")
      .forEach(btn => {

        btn.onclick = () => {

          const target = places.find(
            p =>
              String(p.id) ===
              String(btn.dataset.placeId)
          );


          if (target) {

            setBufferPoint(
              target.lat,
              target.lng,
              target
            );


            activateTool("buffer");


            showToast(
              `${target.name} Menjadi Titik Sumber Buffer`
            );

          }

        };

      });

  });


  /* ---------- MASUKKAN WISATA KE MARKER ---------- */

  if (
    String(place.sourceCategory)
      .toLowerCase() === "wisata"
  ) {

    tourismMarkers.push(marker);

  }


  /* ---------- MASUKKAN COFFEE DAN KULINER ---------- */

  else if (
    getCategoryGroup(place) === "coffee" ||
    getCategoryGroup(place) === "culinary"
  ) {

    tourismMarkers.push(marker);

  }

  else if (getCategoryGroup(place) === "hotel") {

    hotelMarkers.push(marker);

  }


  else if (getCategoryGroup(place) === "transport") {

    transportMarkers.push(marker);

  }


  allMarkers.push(marker);

}



/* ==============================================================================================
   RENDER MARKERS
=============================================================================================== */

/* ---------- RENDER SEMUA MARKER ---------- */

function renderMarkers() {

  tourismLayer.clearLayers();
  hotelLayer.clearLayers();
  transportLayer.clearLayers();


  tourismMarkers = [];
  hotelMarkers = [];
  transportMarkers = [];
  allMarkers = [];


  places.forEach(addPlaceMarker);


  currentFilteredTourism = [
    ...tourismMarkers
  ];


  if ($("mapToggleTourism")?.checked) {

    currentFilteredTourism.forEach(
      marker => tourismLayer.addLayer(marker)
    );

    tourismLayer.addTo(map);

  }


  if ($("mapToggleHotel")?.checked) {

    hotelMarkers.forEach(
      marker => hotelLayer.addLayer(marker)
    );

    hotelLayer.addTo(map);

  }


  if ($("mapToggleTransport")?.checked) {

    transportMarkers.forEach(
      marker => transportLayer.addLayer(marker)
    );

    transportLayer.addTo(map);

  }


  updateLayerCount();

}



/* ==============================================================================================
   UPDATE COUNTER
=============================================================================================== */

/* ---------- UPDATE JUMLAH LAYER ---------- */

function updateLayerCount() {

  if ($("tourismCount")) {

    $("tourismCount").textContent =
      currentFilteredTourism.length;

  }


  if ($("hotelCount")) {

    $("hotelCount").textContent =
      hotelMarkers.length;

  }


  if ($("transportCount")) {

    $("transportCount").textContent =
      transportMarkers.length;

  }

}



/* ==============================================================================================
   TOAST
=============================================================================================== */

let toastTimer;


/* ---------- TAMPILKAN TOAST ---------- */

function showToast(message) {

  const toast = $("mapToast");

  if (!toast) return;


  toast.textContent = message;

  toast.classList.add("show");


  clearTimeout(toastTimer);


  toastTimer = setTimeout(
    () => {
      toast.classList.remove("show");
    },
    2600
  );

}



/* ==============================================================================================
   LAYER TOGGLE - WISATA
=============================================================================================== */

/* ---------- TOGGLE LAYER WISATA ---------- */

$("mapToggleTourism")?.addEventListener(
  "change",
  e => {

    tourismLayer.clearLayers();


    if (e.target.checked) {

      currentFilteredTourism.forEach(
        marker => tourismLayer.addLayer(marker)
      );

      tourismLayer.addTo(map);

    }

    else {

      map.removeLayer(tourismLayer);

    }


    updateLayerCount();

  }
);



/* ==============================================================================================
   LAYER TOGGLE - HOTEL
=============================================================================================== */

/* ---------- TOGGLE LAYER HOTEL ---------- */

$("mapToggleHotel")?.addEventListener(
  "change",
  e => {

    hotelLayer.clearLayers();


    if (e.target.checked) {

      hotelMarkers.forEach(
        marker => hotelLayer.addLayer(marker)
      );

      hotelLayer.addTo(map);

    }

    else {

      map.removeLayer(hotelLayer);

    }


    updateLayerCount();

  }
);



/* ==============================================================================================
   LAYER TOGGLE - TRANSPORT
=============================================================================================== */

/* ---------- TOGGLE LAYER TRANSPORT ---------- */

$("mapToggleTransport")?.addEventListener(
  "change",
  e => {

    transportLayer.clearLayers();


    if (e.target.checked) {

      transportMarkers.forEach(
        marker => transportLayer.addLayer(marker)
      );

      transportLayer.addTo(map);

    }

    else {

      map.removeLayer(transportLayer);

    }


    updateLayerCount();

  }
);



/* ==============================================================================================
   BATAS KECAMATAN MAPID
=============================================================================================== */

/* ---------- LOAD BATAS KECAMATAN ---------- */

async function loadAdminBoundaries() {

  const source = CONFIG.layers?.admin;

  if (
    !source ||
    !source.enabled ||
    !source.url
  ) {

    console.warn(
      "Layer admin tidak aktif atau URL kosong"
    );

    return;

  }

  try {

    console.log(
      "Memuat batas kecamatan dari MAPID..."
    );

    const response =
      await fetch(source.url);

    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }

    const payload =
      await response.json();

    /* Ambil GeoJSON dari Response MAPID */
    let geojson = payload;

    if (
      payload.data &&
      payload.data.type === "FeatureCollection"
    ) {

      geojson =
        payload.data;

    }

    else if (
      payload.result &&
      payload.result.type === "FeatureCollection"
    ) {

      geojson =
        payload.result;

    }

    else if (
      payload.geojson &&
      payload.geojson.type === "FeatureCollection"
    ) {

      geojson =
        payload.geojson;

    }

    /* Pastikan bentuknya FeatureCollection */
    if (
      !geojson ||
      geojson.type !== "FeatureCollection" ||
      !Array.isArray(geojson.features)
    ) {

      console.error(
        "Format GeoJSON batas kecamatan tidak ditemukan:",
        payload
      );

      showToast(
        "Data Batas Kecamatan Tidak Valid"
      );

      return;

    }


    /* Bersihkan Layer Lama */
    adminLayer.clearLayers();


    /* Buat Batas Kecamatan */
    const kecamatanLayer =
      L.geoJSON(
        geojson,
        {

          style: {

            color: "#000000",

            weight: 1.5,

            opacity: 1,

            fillColor: "#030303ac",

            fillOpacity: 0.08

          },


          /* EVENT SETIAP KECAMATAN */
          onEachFeature:
            function(
              feature,
              layer
            ) {

              const properties =
                feature.properties || {};

              let namaKecamatan = "";


              const possibleNames = [

                "kecamatan",

                "Kecamatan",

                "KECAMATAN",

                "nama_kecamatan",

                "Nama_Kecamatan",

                "NAMAKecamatan",

                "WADMKC",

                "NAMOBJ",

                "name",

                "NAME",

                "nama",

                "NAMA"

              ];


              for (
                const key
                of possibleNames
              ) {

                if (
                  properties[key] !== undefined &&
                  properties[key] !== null &&
                  String(
                    properties[key]
                  ).trim() !== ""
                ) {

                  namaKecamatan =
                    String(
                      properties[key]
                    ).trim();

                  break;

                }

              }

              if (!namaKecamatan) {

                const key =
                  Object.keys(
                    properties
                  ).find(
                    k =>
                      k
                        .toLowerCase()
                        .includes("kec")
                  );

                if (key) {

                  namaKecamatan =
                    String(
                      properties[key]
                    ).trim();

                }

              }

              if (!namaKecamatan) {

                namaKecamatan =
                  "Kecamatan";

              }

              layer.bindTooltip(
                namaKecamatan,
                {
                  sticky: true,

                  direction: "top",

                  className:
                    "kecamatan-tooltip",

                  opacity: 1
                }
              );


              /* Saat Mouse Masuk */
              layer.on(
                "mouseover",
                function() {

                  this.setStyle({

                    weight: 3.5,

                    color: "#ff5633",

                    fillColor: "#ff5633",

                    fillOpacity: 0.16

                  });

                  this.bringToFront();

                }
              );


              /* Saat Mouse Keluar */
              layer.on(
                "mouseout",
                function() {

                  this.setStyle({

                    weight: 1.5,

                    color: "#000000",

                    fillColor: "#030303ac",

                    fillOpacity: 0.08

                  });

                }
              );

            }

        }
      );


    /* Masukkan ke adminLayer */
    adminLayer.addLayer(
      kecamatanLayer
    );


    /* Switch aktif, langsung tampil */
    if (
      $("mapToggleAdmin")?.checked
    ) {

      adminLayer.addTo(map);

    }


    console.log(
      `Batas kecamatan berhasil dimuat: ${geojson.features.length} wilayah`
    );

  }

  catch (error) {

    console.error(
      "MAPID admin error:",
      error
    );

    showToast(
      "Gagal Memuat Batas Kecamatan"
    );

  }

}



/* ==============================================================================================
   TOGGLE BATAS KECAMATAN
=============================================================================================== */

/* ---------- TOGGLE BATAS KECAMATAN ---------- */

$("mapToggleAdmin")?.addEventListener(
  "change",
  e => {

    if (e.target.checked) {

      adminLayer.addTo(map);

    }

    else {

      map.removeLayer(
        adminLayer
      );

    }

  }
);


/* ---------- LOAD BATAS KECAMATAN ---------- */
loadAdminBoundaries();



/* ==============================================================================================
   SEARCH PLACE
=============================================================================================== */

/* ---------- CARI TEMPAT ---------- */

function searchPlaceByName(query) {

  const q = String(query || "")
    .trim()
    .toLowerCase();


  if (!q) return null;


  return places.find(
    p =>
      String(p.name)
        .toLowerCase()
        .includes(q)
  );

}


$("searchPlace")?.addEventListener(
  "input",
  function() {

    const result =
      searchPlaceByName(this.value);


    if (result) {
      focusPlace(result);
    }

  }
);


$("searchPlace")?.addEventListener(
  "keydown",
  function(e) {

    if (e.key !== "Enter") return;


    const result =
      searchPlaceByName(this.value);


    if (result) {

      focusPlace(result);

    }

    else {

      showToast("Lokasi Tidak Ditemukan");

    }

  }
);



/* ==============================================================================================
   FOCUS PLACE
=============================================================================================== */

/* ---------- FOKUS TEMPAT ---------- */

function focusPlace(place) {

  map.setView(
    [place.lat, place.lng],
    16
  );


  const marker =
    allMarkers.find(
      m =>
        String(m.placeData?.id) ===
        String(place.id)
    );


  const type = getMarkerType(place);


  if (
    (
      getCategoryGroup(place) === "tourism" ||
      getCategoryGroup(place) === "coffee" ||
      getCategoryGroup(place) === "culinary"
    ) &&
    !$("mapToggleTourism")?.checked
  ) {

    $("mapToggleTourism").click();

  }


  if (
    getCategoryGroup(place) === "hotel" &&
    !$("mapToggleHotel")?.checked
  ) {

    $("mapToggleHotel").click();

  }


  if (
    getCategoryGroup(place) === "transport" &&
    !$("mapToggleTransport")?.checked
  ) {

    $("mapToggleTransport").click();

  }


  setTimeout(
    () => {
      marker?.openPopup();
    },
    100
  );

}



/* ==============================================================================================
   FILTER KATEGORI
=============================================================================================== */

/* ---------- BUAT KEY KATEGORI ---------- */

function categoryOptionKey(group, label = "") {
  return `${group}:${normalizeCategoryText(label)}`;
}


/* ---------- AMBIL LABEL KATEGORI UNIK ---------- */

function uniqueCategoryLabels(group) {

  const seen = new Map();

  places.forEach(place => {
    if (getCategoryGroup(place) !== group) return;

    const label = getCategoryLabel(place);
    const key = normalizeCategoryText(label);

    if (key && !seen.has(key)) {
      seen.set(key, label);
    }
  });

  const priority = group === "culinary"
    ? {
        "restaurant": 0,
        "fast food restaurant": 1,
        "bakery": 2,
        "food court": 3
      }
    : null;

  return [...seen.values()].sort((a, b) => {
    if (priority) {
      const pa = priority[normalizeCategoryText(a)];
      const pb = priority[normalizeCategoryText(b)];
      if (pa !== undefined || pb !== undefined) {
        if (pa === undefined) return 1;
        if (pb === undefined) return -1;
        if (pa !== pb) return pa - pb;
      }
    }
    return a.localeCompare(b, "id");
  });

}


/* ---------- TENTUKAN JUDUL KELOMPOK ---------- */

function categoryGroupTitle(group) {
  return {
    tourism: "PARIWISATA",
    coffee: "CAFE & COFFEE SHOP",
    culinary: "KULINER"
  }[group] || group;
}


/* ---------- RENDER POHON KATEGORI ---------- */

function renderCategoryTree() {

  const container = $("categoryTree");
  if (!container) return;

  const groups = ["tourism", "coffee", "culinary"];

  container.innerHTML = `
    <label class="radio-option category-all">
      <input type="radio" name="category" value="All" checked>
      <span class="radio-circle"></span>
      <span>Semua Kategori</span>
    </label>
  `;

  groups.forEach(group => {

    const labels = uniqueCategoryLabels(group);
    if (!labels.length) return;

    const groupEl = document.createElement("div");
    groupEl.className = "category-group";

    const groupRadio = document.createElement("label");
    groupRadio.className = "radio-option category-parent";
    groupRadio.innerHTML = `
      <input type="radio" name="category" value="group:${group}">
      <span class="radio-circle"></span>
      <span>${esc(categoryGroupTitle(group))}</span>
    `;
    groupEl.appendChild(groupRadio);

    const children = document.createElement("div");
    children.className = "category-children";

    labels.forEach(label => {
      const option = document.createElement("label");
      option.className = "radio-option category-child";
      option.innerHTML = `
        <input type="radio" name="category" value="${esc(categoryOptionKey(group, label))}">
        <span class="radio-circle"></span>
        <span>${esc(label)}</span>
      `;
      children.appendChild(option);
    });

    groupEl.appendChild(children);
    container.appendChild(groupEl);

  });

  container
    .querySelectorAll('input[name="category"]')
    .forEach(input => {
      input.addEventListener("change", applyTourismFilter);
    });

}


/* ---------- CEK KESESUAIAN KATEGORI ---------- */

function categoryMatches(place, selected) {

  if (selected === "All") return true;

  const [kind, ...rest] = selected.split(":");
  const wanted = normalizeCategoryText(rest.join(":"));
  const group = getCategoryGroup(place);
  const label = normalizeCategoryText(getCategoryLabel(place));

  if (kind === "group") {
    return group === wanted;
  }

  return group === kind && label === wanted;

}


/* ---------- TERAPKAN FILTER WISATA ---------- */

function applyTourismFilter() {

  const selected =
    document.querySelector('input[name="category"]:checked')?.value || "All";

  currentFilteredTourism = tourismMarkers.filter(marker => {
    return categoryMatches(marker.placeData, selected);
  });

  tourismLayer.clearLayers();

  if ($("mapToggleTourism")?.checked) {
    currentFilteredTourism.forEach(marker => tourismLayer.addLayer(marker));
    tourismLayer.addTo(map);
  }

  updateLayerCount();

  const selectedLabel =
    document.querySelector('input[name="category"]:checked + .radio-circle + span')?.textContent?.trim() || "Semua Kategori";

  showToast(
    `${currentFilteredTourism.length} titik tampil • ${selectedLabel}`
  );

}



/* ==============================================================================================
   BASEMAP
=============================================================================================== */

document
  .querySelectorAll(".basemap")
  .forEach(
    button =>
      button.addEventListener(
        "click",
        function() {

          [
            streetMap,
            darkMap,
            satelliteMap
          ].forEach(
            layer => map.removeLayer(layer)
          );


          (
            {
              street: streetMap,
              dark: darkMap,
              satellite: satelliteMap
            }[this.dataset.map] ||
            streetMap
          ).addTo(map);


          document
            .querySelectorAll(".basemap")
            .forEach(
              b => b.classList.remove("active")
            );


          this.classList.add("active");

        }
      )
  );



/* ==============================================================================================
   BUFFER
=============================================================================================== */

let bufferPoint = null;

let bufferCircle = null;

let bufferSourceMarker = null;

let bufferPickMode = false;

const bufferResultLayer =
  L.layerGroup().addTo(map);



/* ==============================================================================================
   SET BUFFER POINT
=============================================================================================== */

/* ---------- SET TITIK BUFFER ---------- */

function setBufferPoint(
  lat,
  lng,
  place = null
) {

  bufferPoint = L.latLng(lat, lng);


  if (bufferSourceMarker) {

    bufferResultLayer.removeLayer(
      bufferSourceMarker
    );

  }


  bufferSourceMarker =
    L.circleMarker(
      bufferPoint,
      {
        radius: 8,
        color: "#111",
        weight: 3,
        fillColor: "#ff5b2e",
        fillOpacity: 1
      }
    )
    .addTo(bufferResultLayer);


  if ($("bufferSelected")) {

    $("bufferSelected").textContent =
      place
        ? place.name
        : `Titik: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;


    $("bufferSelected").classList.add(
      "selected"
    );

  }


  bufferPickMode = false;


  $("bufferPick")?.classList.remove("active");


  if ($("bufferPick")) {

    $("bufferPick").innerHTML =
      "⊙ &nbsp; Tandai Titik di Peta";

  }


  updateBufferPreview();

}



/* ==============================================================================================
   BUFFER PREVIEW
=============================================================================================== */

/* ---------- UPDATE PREVIEW BUFFER ---------- */

function updateBufferPreview() {

  if (!bufferPoint) return;


  const radius =
    Number(
      $("bufferRadius")?.value || 1000
    );


  if (bufferCircle) {

    bufferResultLayer.removeLayer(
      bufferCircle
    );

  }


  bufferCircle =
    L.circle(
      bufferPoint,
      {
        radius,
        className: "buffer-circle"
      }
    )
    .addTo(bufferResultLayer);


  map.fitBounds(
    bufferCircle.getBounds(),
    {
      padding: [50, 50],
      maxZoom: 15
    }
  );

}


$("bufferRadius")?.addEventListener(
  "input",
  function() {

    const v = Number(this.value);


    if ($("bufferRadiusValue")) {

      $("bufferRadiusValue").textContent =
        v >= 1000
          ? `${v / 1000} km`
          : `${v} m`;

    }


    updateBufferPreview();

  }
);


$("bufferPick")?.addEventListener(
  "click",
  function() {

    bufferPickMode = !bufferPickMode;

    isoPickMode = false;


    this.classList.toggle(
      "active",
      bufferPickMode
    );


    this.innerHTML =
      bufferPickMode
        ? "✓ Klik lokasi di peta"
        : "⊙ &nbsp; Tandai Titik di Peta";


    if (bufferPickMode) {

      showToast(
        "Klik lokasi di peta untuk titik buffer"
      );

    }

  }
);


$("bufferSearch")?.addEventListener(
  "keydown",
  function(e) {

    if (e.key !== "Enter") return;


    const p =
      searchPlaceByName(this.value);


    if (p) {

      setBufferPoint(
        p.lat,
        p.lng,
        p
      );


      focusPlace(p);

    }

    else {

      showToast("Lokasi Tidak Ditemukan");

    }

  }
);



/* ==============================================================================================
   RUN BUFFER
=============================================================================================== */

$("runBuffer")?.addEventListener(
  "click",
  () => {

    if (!bufferPoint) {

      return showToast(
        "Pilih Titik Sumber Terlebih Dahulu"
      );

    }


    if (!window.turf) {

      return showToast(
        "Turf.js Belum Termuat"
      );

    }


    const radius =
      Number(
        $("bufferRadius")?.value || 1000
      );


    /*
     * TITIK PUSAT BUFFER
     */
    const center =
      turf.point(
        [
          bufferPoint.lng,
          bufferPoint.lat
        ]
      );


    /* POLYGON BUFFER */
    const polygon =
      turf.buffer(
        center,
        radius / 1000,
        {
          units: "kilometers"
        }
      );


    /* UBAH SEMUA HOTEL MENJADI TITIK TURF */
    const hotelFeatures =
      hotelMarkers.map(
        marker => {

          const place =
            marker.placeData;

          return turf.point(
            [
              place.lng,
              place.lat
            ],
            place
          );

        }
      );


    /* CARI HOTEL YANG MASUK KE DALAM BUFFER */
    const inside =
      turf.pointsWithinPolygon(
        turf.featureCollection(
          hotelFeatures
        ),
        polygon
      );


    /* HITUNG JARAK SETIAP HOTEL DARI TITIK SUMBER */
    const nearbyHotels =
      inside.features
        .map(
          feature => {

            const distanceKm =
              turf.distance(
                center,
                feature,
                {
                  units: "kilometers"
                }
              );

            return {
              place:
                feature.properties || {},

              distanceKm
            };

          }
        )
        .sort(
          (a, b) =>
            a.distanceKm -
            b.distanceKm
        );


    /* ---------- FORMAT JARAK ---------- */
    /* ---------- FORMAT JARAK BUFFER ---------- */
    function formatBufferDistance(
      distanceKm
    ) {

      if (distanceKm < 1) {

        return `${Math.round(
          distanceKm * 1000
        )} m`;

      }

      return `${distanceKm.toFixed(2)} km`;

    }


    /* BUAT DAFTAR HOTEL */
    const hotelList =
      nearbyHotels.length
        ? `
          <div class="buffer-hotel-list">

            ${nearbyHotels
              .map(
                (item, index) => {

                  const place =
                    item.place;

                  return `
                  <a
                    class="buffer-hotel-item"
                    href="${googleMapsUrl(place)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >

                    <div class="buffer-hotel-number">
                      ${index + 1}
                    </div>

                    <div class="buffer-hotel-info">

                      <strong>
                        ${
                          place.name ||
                          "Nama hotel tidak tersedia"
                        }
                      </strong>

                      <span>
                        ${formatBufferDistance(
                          item.distanceKm
                        )}
                      </span>

                    </div>

                  </a>
                `;

                }
              )
              .join("")}

          </div>
        `
        : `
          <div class="buffer-empty">
            Tidak ada hotel/penginapan
            dalam radius tersebut.
          </div>
        `;


    /* TAMPILKAN HASIL */
    if ($("bufferResult")) {

  


  $("bufferResult").innerHTML =
    `
      <span class="result-title">
        HASIL BUFFER
      </span>

      <strong class="buffer-summary">

        ${inside.features.length}
        hotel/penginapan ditemukan dalam radius
        ${
          radius >= 1000
            ? `${radius / 1000} km`
            : `${radius} m`
        }

      </strong>

      <div class="buffer-hotel-list">

        ${
          hotelList ||
          `
            <div class="buffer-empty">
              Tidak ada hotel/penginapan
              dalam radius tersebut.
            </div>
          `
        }

      </div>
    `;

}


    /* TOAST */
    showToast(
      `${nearbyHotels.length} Hotel Berada Dalam Area Buffer`
    );

  }
);



/* ==============================================================================================
   CLEAR BUFFER
=============================================================================================== */

/* ---------- CLEAR HASIL BUFFER ---------- */

$("clearBuffer")?.addEventListener(
  "click",
  () => {

    bufferPoint = null;
    bufferCircle = null;
    bufferSourceMarker = null;


    bufferResultLayer.clearLayers();


    if ($("bufferSelected")) {

      $("bufferSelected").textContent =
        "Belum Ada Titik Dipilih";

      $("bufferSelected").classList.remove(
        "selected"
      );

    }


    if ($("bufferResult")) {

      $("bufferResult").innerHTML =
        `
          <span class="result-title">
            HASIL BUFFER
          </span>

          <strong>
            Pilih Titik Untuk Memulai.
          </strong>
        `;

    }

  }
);



/* ==============================================================================================
   ISOCHRONE
=============================================================================================== */

let isoPoint = null;

let isoArea = null;

let isoSourceMarker = null;

let isoPickMode = false;

const isoResultLayer =
  L.layerGroup().addTo(map);

let selectedMode = "cycling";


/* ---------- SET TITIK ISOCHRONE ---------- */


function setIsoPoint(
  lat,
  lng,
  place = null
) {

  isoPoint = L.latLng(lat, lng);


  if (isoSourceMarker) {

    isoResultLayer.removeLayer(
      isoSourceMarker
    );

  }


  isoSourceMarker =
    L.circleMarker(
      isoPoint,
      {
        radius: 8,
        color: "#111",
        weight: 3,
        fillColor: "#08a957",
        fillOpacity: 1
      }
    )
    .addTo(isoResultLayer);


  if ($("isoSelected")) {

    $("isoSelected").textContent =
      place
        ? place.name
        : `Titik: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;


    $("isoSelected").classList.add(
      "selected"
    );

  }


  isoPickMode = false;


  $("isoPick")?.classList.remove("active");


  if ($("isoPick")) {

    $("isoPick").innerHTML =
      "⊙ &nbsp; Tandai Titik di Peta";

  }

}



/* ==============================================================================================
   ISO PICK
=============================================================================================== */

/* ---------- PILIH TITIK ISOCHRONE ---------- */

$("isoPick")?.addEventListener(
  "click",
  function() {

    isoPickMode = !isoPickMode;

    bufferPickMode = false;


    this.classList.toggle(
      "active",
      isoPickMode
    );


    this.innerHTML =
      isoPickMode
        ? "✓ Klik lokasi di peta"
        : "⊙ &nbsp; Tandai Titik di Peta";


    if (isoPickMode) {

      showToast(
        "Klik Lokasi di Peta Untuk Titik Isochrone"
      );

    }

  }
);



/* ==============================================================================================
   ISO SEARCH
=============================================================================================== */

/* ---------- CARI TRANSPORTASI ---------- */

$("isoSearch")?.addEventListener(
  "keydown",
  function(e) {

    if (e.key !== "Enter") return;


    const q =
      this.value
        .trim()
        .toLowerCase();


    const p =
      places.find(
        x =>
          String(x.sourceCategory)
            .toLowerCase()
            .includes("transport") &&

          String(x.name)
            .toLowerCase()
            .includes(q)
      );


    if (p) {

      setIsoPoint(
        p.lat,
        p.lng,
        p
      );


      focusPlace(p);

    }

    else {

      showToast(
        "Hub Transportasi Tidak Ditemukan"
      );

    }

  }
);


$("isoDuration")?.addEventListener(
  "input",
  function() {

    if ($("isoDurationValue")) {

      $("isoDurationValue").textContent =
        `${this.value} menit`;

    }

  }
);



/* ==============================================================================================
   MODE
=============================================================================================== */

document
  .querySelectorAll(".mode-button")
  .forEach(
    btn =>
      btn.addEventListener(
        "click",
        function() {

          document
            .querySelectorAll(".mode-button")
            .forEach(
              b => b.classList.remove("active")
            );


          this.classList.add("active");


          selectedMode = this.dataset.mode;

        }
      )
  );


/* ---------- TENTUKAN PROFILE ORS ---------- */

function orsProfile(mode) {

  return (
    {
      walking: "foot-walking",
      cycling: "cycling-regular",
      driving: "driving-car"
    }[mode] ||
    "cycling-regular"
  );

}



/* ==============================================================================================
   RUN ISOCHRONE
=============================================================================================== */

/* ---------- JALANKAN ANALISIS ISOCHRONE ---------- */

$("runIsochrone")?.addEventListener(
  "click",
  async () => {

    if (!isoPoint) {

      return showToast(
        "Pilih Titik Sumber Terlebih Dahulu"
      );

    }


    const cfg = CONFIG.isochrone || {};

    const key = cfg.orsApiKey;


    if (!key) {

      if ($("isoResult")) {

        $("isoResult").innerHTML =
          `
            <span class="result-title">
              HASIL ISOCHRONE
            </span>

            <strong>
              Isi ORS API key di js/config.js
              untuk menjalankan isochrone.
            </strong>
          `;

      }


      return showToast(
        "ORS API Key Belum Diisi"
      );

    }


    const duration =
      Number(
        $("isoDuration")?.value || 30
      );


    const runButton = $("runIsochrone");


    if (runButton) {

      runButton.disabled = true;
      runButton.textContent = "Memproses area...";

    }


    try {

      const url =
        `${cfg.orsUrl || "https://api.openrouteservice.org/v2/isochrones"}/${orsProfile(selectedMode)}`;


      const response =
        await fetch(
          url,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              "Authorization": key
            },

            body: JSON.stringify(
              {
                locations: [
                  [
                    isoPoint.lng,
                    isoPoint.lat
                  ]
                ],

                range: [
                  duration * 60
                ],

                range_type: "time"
              }
            )
          }
        );


      if (!response.ok) {
        throw new Error(`ORS HTTP ${response.status}`);
      }


      const geojson =
        await response.json();


      if (isoArea) {

        isoResultLayer.removeLayer(
          isoArea
        );

      }


      isoArea =
        L.geoJSON(
          geojson,
          {
            style: {
              className: "isochrone-area",
              color: "#087e45",
              weight: 2,
              fillColor: "#08a957",
              fillOpacity: 0.18
            }
          }
        )
        .addTo(isoResultLayer);


      const destinations =
        tourismMarkers.filter(
          marker => {

            const point =
              turf.point(
                [
                  marker.placeData.lng,
                  marker.placeData.lat
                ]
              );


            return (
              geojson.features?.some(
                feature =>
                  turf.booleanPointInPolygon(
                    point,
                    feature
                  )
              )
            );

          }
        );


      /* HITUNG JARAK SETIAP DESTINASI DARI TITIK SUMBER ISOCHRONE */
      const nearbyDestinations =
        destinations
          .map(
            marker => {

              const place =
                marker.placeData || {};

              const center =
                turf.point([
                  isoPoint.lng,
                  isoPoint.lat
                ]);

              const destination =
                turf.point([
                  place.lng,
                  place.lat
                ]);

              const distanceKm =
                turf.distance(
                  center,
                  destination,
                  {
                    units: "kilometers"
                  }
                );

              return {
                place: place,
                distanceKm: distanceKm
              };

            }
          )
          .sort(
            (a, b) =>
              a.distanceKm -
              b.distanceKm
          );


/* ---------- FORMAT JARAK ISOCHRONE ---------- */

function formatIsoDistance(
  distanceKm
) {

  if (distanceKm < 1) {

    return `${Math.round(
      distanceKm * 1000
    )} m`;

  }

  return `${distanceKm.toFixed(2)} km`;

}


/* ---------- BUAT DAFTAR DESTINASI ---------- */

let destinationList = "";


if (
  nearbyDestinations.length > 0
) {

  destinationList =
    '<div class="buffer-hotel-list">';

  nearbyDestinations.forEach(
  (item, index) => {

    const place =
      item.place;

    destinationList +=
      `
      <a
        class="buffer-hotel-item"
        href="${googleMapsUrl(place)}"
        target="_blank"
        rel="noopener noreferrer"
      >

        <div class="buffer-hotel-number">
          ${index + 1}
        </div>

        <div class="buffer-hotel-info">

          <strong>
            ${
              place.name ||
              "Nama destinasi tidak tersedia"
            }
          </strong>

          <span>
            ${
              formatIsoDistance(
                item.distanceKm
              )
            }
          </span>

        </div>

      </a>
      `;

  }
);

  destinationList +=
    "</div>";

}
else {

  destinationList =
    `
    <div class="buffer-empty">
      Tidak ada destinasi
      dalam area jangkauan.
    </div>
    `;

}


/* ---------- TAMPILKAN HASIL ISOCHRONE ---------- */

if ($("isoResult")) {

  $("isoResult").innerHTML =
    `
      <span class="result-title">
        HASIL ISOCHRONE
      </span>

      <strong class="buffer-summary">

        ${
          nearbyDestinations.length
        }
        destinasi dapat dijangkau dalam
        ${duration} menit dengan moda
        ${getModeName(selectedMode)}

      </strong>

      ${destinationList}
    `;

}


      map.fitBounds(
        isoArea.getBounds(),
        {
          padding: [50, 50]
        }
      );


      showToast(
        "Area Isochrone Berhasil Ditampilkan"
      );

    }

    catch (error) {

      console.error(
        "Isochrone error:",
        error
      );


      if ($("isoResult")) {

        $("isoResult").innerHTML =
          `
            <span class="result-title">
              HASIL ISOCHRONE
            </span>

            <strong>
              Gagal mengambil area isochrone.
              Periksa API key dan koneksi.
            </strong>
          `;

      }


      showToast(
        "Isochrone Gagal Dimuat"
      );

    }

    finally {

      if (runButton) {

        runButton.disabled = false;

        runButton.innerHTML =
          "◉ &nbsp; Tampilkan Area Jangkauan";

      }

    }

  }
);



/* ==============================================================================================
   MODE NAME
=============================================================================================== */

/* ---------- AMBIL NAMA MODE ---------- */

function getModeName(mode) {

  return (
    {
      walking: "Jalan",
      cycling: "Sepeda",
      driving: "Motor/Mobil"
    }[mode] ||
    mode
  );

}



/* ==============================================================================================
   CLEAR ISOCHRONE
=============================================================================================== */

$("clearIsochrone")?.addEventListener(
  "click",
  () => {

    isoPoint = null;
    isoArea = null;
    isoSourceMarker = null;


    isoResultLayer.clearLayers();


    if ($("isoSelected")) {

      $("isoSelected").textContent =
        "Belum Ada Titik Dipilih";

      $("isoSelected").classList.remove(
        "selected"
      );

    }


    if ($("isoResult")) {

      $("isoResult").innerHTML =
        `
          <span class="result-title">
            HASIL ISOCHRONE
          </span>

          <strong>
            Pilih titik sumber.
          </strong>
        `;

    }

  }
);



/* ==============================================================================================
   MAP CLICK
=============================================================================================== */

/* ---------- KLIK PETA ---------- */

map.on(
  "click",
  e => {

    if (bufferPickMode) {

      setBufferPoint(
        e.latlng.lat,
        e.latlng.lng
      );

    }

    else if (isoPickMode) {

      setIsoPoint(
        e.latlng.lat,
        e.latlng.lng
      );

    }

  }
);



/* ==============================================================================================
   PANEL LAYER DAN LEGENDA
=============================================================================================== */

/* ---------- SINKRONISASI PANEL PETA ---------- */

function syncMapPanels() {

  const layers = document.querySelector(".map-layers");
  const legend = document.querySelector(".map-legend");

  if (!layers || !legend) return;

  const gap = 12;
  const legendBottom = 22;
  const bottom = legendBottom + legend.offsetHeight + gap;

  layers.style.bottom = `${bottom}px`;
}


/* ---------- ATUR PANEL COLLAPSE ---------- */

function setupCollapsiblePanel(
  toggleId,
  bodyId
) {

  const toggle = $(toggleId);
  const body = $(bodyId);


  if (!toggle || !body) return;


  /* ---------- UPDATE TOMBOL PANEL ---------- */

  function updateButton() {

    const isCollapsed =
      body.classList.contains("collapsed");


    toggle.textContent =
      isCollapsed
        ? "⌄"
        : "⌃";


    toggle.setAttribute(
      "aria-expanded",
      String(!isCollapsed)
    );

  }


  toggle.addEventListener(
    "click",
    e => {

      e.preventDefault();
      e.stopPropagation();


      body.classList.toggle("collapsed");

      updateButton();
      syncMapPanels();

    }
  );


  updateButton();

}


/* ---------- LAYER PANEL ---------- */

setupCollapsiblePanel(
  "layersToggle",
  "layersBody"
);


/* ---------- LEGENDA PANEL ---------- */

setupCollapsiblePanel(
  "legendToggle",
  "legendBody"
);


$("legendBody")?.classList.add(
  "collapsed"
);

syncMapPanels();
window.addEventListener("resize", syncMapPanels);



/* ==============================================================================================
   TOOL TABS
=============================================================================================== */

/* ---------- AKTIFKAN TOOL ---------- */

function activateTool(name) {

  document
    .querySelectorAll(".tool-tab")
    .forEach(
      tab =>
        tab.classList.toggle(
          "active",
          tab.dataset.tool === name
        )
    );


  document
    .querySelectorAll(".tool-section")
    .forEach(
      section =>
        section.classList.toggle(
          "active",
          section.id === `tool-${name}`
        )
    );

}


document
  .querySelectorAll(".tool-tab")
  .forEach(
    tab =>
      tab.addEventListener(
        "click",
        () =>
          activateTool(
            tab.dataset.tool
          )
      )
  );



/* ==============================================================================================
   MOBILE PANEL
=============================================================================================== */

/* ---------- BUKA PANEL MOBILE ---------- */

$("openPanel")?.addEventListener(
  "click",
  () =>
    document
      .querySelector(".map-panel")
      ?.classList.toggle("open")
);



/* ==============================================================================================
   START
=============================================================================================== */

/* ---------- INISIALISASI PETA ---------- */

(async function init() {

  await loadPlaces();


  renderCategoryTree();
  renderMarkers();


  setTimeout(
    () => {

      map.invalidateSize();

    },
    300
  );


  console.log(
    `Bandung—Go WebGIS loaded: ${places.length} places`
  );


  console.log(
    "Marker wisata menggunakan Tipe 2 Attribute Table"
  );


  console.log(
    "Wisata Alam = marker pohon"
  );


  console.log(
    "Legenda harus menggunakan ikon pohon yang sama untuk Wisata Alam"
  );

})();