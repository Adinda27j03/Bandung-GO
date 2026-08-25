window.MAPID_CONFIG = {
  layers: {
    transport: {
      enabled: true,
      url: "https://geoserver.mapid.io/layers_new/get_layer?api_key=356dec4b97a1415d8a6796644b0e3c9b&layer_id=6a83fb8772e99b469ca284df&project_id=6a83fa0272e99b469ca1a14e"
    },

    hotel: {
      enabled: true,
      url: "https://geoserver.mapid.io/layers_new/get_layer?api_key=356dec4b97a1415d8a6796644b0e3c9b&layer_id=6a83fb9875d42d9fe79625da&project_id=6a83fa0272e99b469ca1a14e&limit=1000"
    },

    tourism: {
      enabled: true,
      url: "https://geoserver.mapid.io/layers_new/get_layer?api_key=356dec4b97a1415d8a6796644b0e3c9b&layer_id=6a83fa5475d42d9fe794a8fa&project_id=6a83fa0272e99b469ca1a14e"
    },

    coffee: {
      enabled: true,
      url: "https://geoserver.mapid.io/layers_new/get_layer?api_key=356dec4b97a1415d8a6796644b0e3c9b&layer_id=6a83fa9875d42d9fe794e932&project_id=6a83fa0272e99b469ca1a14e"
    },

    coffee2: {
      enabled: true,
      url: "https://geoserver.mapid.io/layers_new/get_layer?api_key=356dec4b97a1415d8a6796644b0e3c9b&layer_id=6a8beade4da1860f130eab24&project_id=6a83fa0272e99b469ca1a14e"
    },

    culinary: {
        enabled: true,
        url: "https://geoserver.mapid.io/layers_new/get_layer?api_key=356dec4b97a1415d8a6796644b0e3c9b&layer_id=6a8beae9880d11c7baf26087&project_id=6a83fa0272e99b469ca1a14e&limit=1000"
    },

    admin: {
      enabled: true,
      url: "https://geoserver.mapid.io/layers_new/get_layer?api_key=356dec4b97a1415d8a6796644b0e3c9b&layer_id=6a8af4674da1860f1390541b&project_id=6a83fa0272e99b469ca1a14e"
    }
  },

  isochrone: {
    provider: "ors",
    orsApiKey: "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA1NzAyMDYyMzA1ZjQ5MmQ4OWM4ZjljYjQyMGE4MmJiIiwiaCI6Im11cm11cjY0In0=",
    orsUrl: "https://api.openrouteservice.org/v2/isochrones"
  }
};