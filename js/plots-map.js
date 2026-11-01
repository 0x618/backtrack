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

      // Add waypoint map layer and first waypoint
      const waypointLayer = new GraphicsLayer.default({ title: 'Pheasant Hunts' });
      waypointLayer.add(new Graphic.default({
        geometry: {
          type: 'point',
          longitude: -101.60223,
          latitude: 46.80432,
        },
        symbol: {
          type: 'simple-marker',
          style: 'cross',
          color: '#84d400',
          size: 14,
          outline: { color: '#212529', width: 1.5 },
        },
        attributes: {
          name: ' 10/25/2026 - Pheasant #3 ',
          notes: 'Good access and well off the highway. Walked around dusk; lots of male pheasants. Several shots taken, one harvested.',
        },
        popupTemplate: {
          title: '{name}',
          content: '{notes}',
        },
      }));

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
