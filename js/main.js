	$(document).ready(function() {

		var cities;
		var map = L.map('map', {
			center: [46.8797, -110.3626],
			zoom: 6,
			minZoom: 4
		});

		L.tileLayer(
    	'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'OSM'
			}).addTo(map);

      	$.getJSON('data/dataMT.geojson')
      		.done(function(data) {
      			var info = processData(data);
            createPropSymbols(info.timestamps, data);
						createSliderUI(info.timestamps);
      	 	})
      	.fail(function() { alert('There has been a problem loading the data.')});

        	function processData(data) {
        		var timestamps = [];
        		var min = Infinity;
        		var max = -Infinity;

        		for (var feature in data.features) {

        			var properties = data.features[feature].properties;

        			for (var attribute in properties) {

        				if ( attribute != 'id' &&
        				  attribute != 'Name' &&
        				  attribute != 'lat' &&
        				  attribute != 'lon' ) {

        					if ( $.inArray(attribute,timestamps) === -1) {
        						timestamps.push(attribute);
          				}

        					if (properties[attribute] < min) {
        						min = properties[attribute];
        					}

        					if (properties[attribute] > max) {
        						max = properties[attribute];
        					}
        				}
        			}
        		}

        		return {
          		timestamps : timestamps,
        			min : min,
        			max : max
        		}
        	}

          	function createPropSymbols(timestamps, data) {

          		cities = L.geoJson(data, {

          			pointToLayer: function(feature, latlng) {

          			return L.circleMarker(latlng, {
          				 fillColor: '#708598',
          				 color: '#537898',
          				 weight: 1,
          				 fillOpacity: 0.6
          				}).on({

          					mouseover: function(e) {
          						this.openPopup();
          						this.setStyle({color: 'yellow'});
          					},
          					mouseout: function(e) {
          						this.closePopup();
          						this.setStyle({color: '#537898'});

          					}
          				});
          			}
          		}).addTo(map);

              updatePropSymbols(timestamps[0]);

          	}

            function updatePropSymbols(timestamp) {

              cities.eachLayer(function(layer) {

			             var props = layer.feature.properties;
			             var radius = calcPropRadius(props[timestamp]);
			             var popupContent = '<b>' + String(props[timestamp]) +
				                              ' units</b><br>' +
				                              '<i>' + props.Name +
					                            '</i> in </i>' +
					                            timestamp + '</i>';
                  layer.setRadius(radius);
			            layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });
		});
	 }
	  function calcPropRadius(attributeValue) {

		    var scaleFactor = .5;
        var area = attributeValue * scaleFactor;
        return Math.sqrt(area/Math.PI)*2;
	}

	function createSliderUI(timestamps) {

		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create('input', 'range-slider');

			L.DomEvent.addListener(slider, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(slider)
				.attr({'type':'range',
					'max': timestamps[timestamps.length-1],
					'min': timestamps[0],
					'step': 1,
				  'value': String(timestamps[0])})
		  		.on('input change', function() {
		  		updatePropSymbols($(this).val().toString());
					$('.temporal-legend').text(this.value);
		  	});
			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(timestamps[0]);
	}

	function createTemporalLegend(startTimestamp) {
		var temporalLegend = L.control({position: 'bottomleft'});

		temporalLegend.onAdd = function(map) {
			var output = L.DomUtil.create('output', 'temporal-legend');
			$(output).text(startTimestamp);
			return output;
		}
		temporalLegend.addTo(map);
	}

	});
