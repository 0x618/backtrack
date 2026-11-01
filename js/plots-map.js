(function (Drupal, once) {
  const views = new WeakMap();
  const selector = '.plots-map';
  const serviceUrl = 'https://ndgishub.nd.gov/arcgis/rest/services/Applications/GNF_PLOTSGuideCached/MapServer';

  // Drupal.behaviors example from the docs:
  // https://www.drupal.org/docs/drupal-apis/javascript-api/javascript-api-overview#s-example-using-drupalbehaviors
  Drupal.behaviors.plotsMap = {
    attach(context) {
      once('plots-map', selector, context).forEach((element) => {
        initializeMap(element);
      });
    },

    detach(context, settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }

      once.remove('plots-map', selector, context).forEach((element) => {
        const view = views.get(element);
        if (view) {
          view.destroy();
          views.delete(element);
        }
      });
    },
  };

  async function initializeMap(element) {
    const status = element.querySelector('.plots-map__status');
    const container = element.querySelector('.plots-map__view');

    try {
      const [
        Basemap,
        Map,
        FeatureLayer,
        Graphic,
        GraphicsLayer,
        MapView,
        LayerList,
      ] = await Promise.all([
        import('https://js.arcgis.com/5.1/@arcgis/core/Basemap.js'),
        import('https://js.arcgis.com/5.1/@arcgis/core/Map.js'),
        import('https://js.arcgis.com/5.1/@arcgis/core/layers/FeatureLayer.js'),
        import('https://js.arcgis.com/5.1/@arcgis/core/Graphic.js'),
        import('https://js.arcgis.com/5.1/@arcgis/core/layers/GraphicsLayer.js'),
        import('https://js.arcgis.com/5.1/@arcgis/core/views/MapView.js'),
        import('https://js.arcgis.com/5.1/@arcgis/core/widgets/LayerList.js'),
      ]);

      if (!element.isConnected) {
        return;
      }

      const plotsLayer = new FeatureLayer.default({
        url: `${serviceUrl}/19`,
        title: 'NDGF PLOTS',
        opacity: 0.6,
        popupTemplate: {
          title: '{Unit_Name}',
          content: [{
            type: 'fields',
            fieldInfos: [
              { fieldName: 'County_Name', label: 'County' },
              { fieldName: 'Acres', label: 'Acres' },
              { fieldName: 'StartDate', label: 'Open date' },
              { fieldName: 'EndDate', label: 'Close date' },
            ],
          }],
        },
      });

      // Waypoint details object array
      // Success value determines waypoint color
      const waypoints = [
        {
          longitude: -101.05046,
          latitude: 48.13725,
          name: '10/10/2026 - Pheasant #1',
          notes: 'Beck farm land. Fair number of pheasants on the road around dawn, but fewer than previous years. Saw several in the tree rows south on the farm, mostly females. Harvested 1 rooster by the road on the North edge of the farm.',
          success: true
        },
        {
          longitude: -100.14033,
          latitude: 47.05918,
          name: '10/17/2026 - Pheasant #2',
          notes: 'Lots of activity in surrounding PLOTS land. This lot has parking to the south and a close dwelling on the east side, but there\'s great habitat running the entire west side of the lot. Might be good late season. Saw 2 older males, harvested 1.',
          success: true
        },
        {
          longitude: -101.61068,
          latitude: 46.8358,
          name: '10/24/2026 - None',
          notes: 'Sighted several male pheasants, 2 grouse. No shots taken.',
          success: false
        },
        {
          longitude: -101.60223,
          latitude: 46.80432,
          name: '10/25/2026 - Pheasant #3',
          notes: 'Good access and well off the highway. Walked around dusk; lots of male pheasants. Several shots taken, one harvested.',
          success: true
        }
      ];
      // Loop through Waypoint data array to add each to the waypointLayer
      const waypointLayer = new GraphicsLayer.default({ title: 'Pheasant Hunts' });
      waypoints.forEach((waypoint) => {
        waypointLayer.add(new Graphic.default({
          geometry: {
            type: 'point',
            longitude: waypoint.longitude,
            latitude: waypoint.latitude,
          },
          symbol: {
            type: 'simple-marker',
            style: 'circle',
            color: waypoint.success ? '#84d400' : '#ff3b30',
            size: 13,
            outline: { color: '#212529', width: 1.5 },
          },
          attributes: {
            name: waypoint.name,
            notes: waypoint.notes,
          },
          popupTemplate: {
            title: '{name}',
            content: '{notes}',
          },
        }));
      });

      const map = new Map.default({
        basemap: new Basemap.default({
          portalItem: { id: '4f2e99ba65e34bb8af49733d9778fb8e' },
        }),
        layers: [plotsLayer, waypointLayer],
      });

      const view = new MapView.default({
        map,
        container,
        center: [
          Number(element.dataset.centerLongitude),
          Number(element.dataset.centerLatitude),
        ],
        zoom: Number(element.dataset.zoom),
      });
      views.set(element, view);
      view.ui.add(new LayerList.default({ view }), 'top-right');

      await view.when();
      await Promise.all(map.layers.map((layer) => layer.load()));
      status.textContent = '';
    }
    catch (error) {
      console.error('PLOTS Map module failed to load: ', error);
      status.textContent = 'The map could not be loaded. Check the browser console for details.';
    }
  }
})(Drupal, once);
