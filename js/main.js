	$(document).ready(function() {

		var cities;
		var coords = [46.8797, -110.3626, 6];
		var map = L.map('map', {
			center: [coords[0], coords[1]],
			zoom: coords[2],
			minZoom: 6,
			zoomControl: false
		});

		var basemap = L.tileLayer(
			'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>, Data sourced from <a href="https://www.census.gov/data/tables/2017/demo/popest/total-cities-and-towns.html">US Census</a>',
				subdomains: 'abcd',
				maxZoom: 19
			}).addTo(map);

		var esri_WorldImagery = L.tileLayer(
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
				attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
			});

		$.getJSON('data/popData.geojson')
			.done(function(data) {
				var info = processData(data);
				createPropSymbols(info.timestamps, data);
				populateBar();
				createSliderUI(info.timestamps);
				jqueryInitialize();
				basemapSwitcher();
				zoomButtons();
			})
			.fail(function() {
				alert('There has been a problem loading the data.')
			});

		function processData(data) {
			var timestamps = [];
			var min = Infinity;
			var max = -Infinity;

			for (var feature in data.features) {
				var properties = data.features[feature].properties;

				for (var attribute in properties) {

					if (attribute != 'id' &&
						attribute != 'name' &&
						attribute != 'lat' &&
						attribute != 'lon') {

						if ($.inArray(attribute, timestamps) === -1) {
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
				timestamps: timestamps,
				min: min,
				max: max
			}
		}

		function createPropSymbols(timestamps, data) {

			cities = L.geoJson(data, {

				pointToLayer: function(feature, latlng) {
					return L.circleMarker(latlng, {
						fillColor: '#B84E14',
						color: '#341809',
						weight: 1,
						fillOpacity: 0.6
					}).on({
						mouseover: function(e) {
							this.openPopup();
							this.setStyle({
								color: '#FC600A'
							});
						},
						mouseout: function(e) {
							this.closePopup();
							this.setStyle({
								color: '#341809'
							});

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
				var percent = props[timestamp] * 100 - 100;
				var change = 'increased';
				if (percent < 0) {
					change = 'decreased';
				}
				var popupContent = '<b> Population ' + change + ' by ' + String(percent
						.toFixed(
							0)) +
					'%</b><br>' +
					'<i>' + props.name +
					'</i> in </i>' +
					timestamp + '</i>';
				layer.setRadius(radius);
				layer.bindPopup(popupContent, {
					offset: new L.Point(0, -radius)
				});
			});
		}

		function calcPropRadius(attributeValue) {
			var scaleFactor = 60;
			var area = (attributeValue * 100 - 100) * scaleFactor;
			if (area < 0) {
				area = 1;
			}
			return Math.sqrt(area / Math.PI) * 2;
		}

		function createSliderUI(timestamps) {

			var slider = L.DomUtil.create('div', 'slider');

			L.DomEvent.addListener(slider, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});
			$(slider)
				.slider({
					max: parseInt(timestamps[timestamps.length - 1]),
					min: parseInt(timestamps[0]),
					step: 1,
					value: parseInt(timestamps[0]),
					slide: function(event, ui) {
						updatePropSymbols(ui.value.toString());
						$('.year').html("Year: " + ui.value);
					}

				});
			$("#bar").append("<h3 class='year'>Year: 2011</h3>");
			$('#bar').append(slider);
		}

		function zoomButtons() {
			var zoom = L.control({
				position: 'topright'
			});

			zoom.onAdd = function(map) {
				var buttons = L.DomUtil.create('div', 'zoomButtons');
				var content = '<ul class="buttons">';
				content += '<li class="zoomIn"><i class="fas fa-plus"></i></li>';
				content += '<li class="home"><i class="fas fa-home"></i></li>';
				content += '<li class="zoomOut"><i class="fas fa-minus"></i></li>';
				content += '</ul>';
				$(buttons).append(content);
				return buttons;
			}
			zoom.addTo(map);
			$(".zoomIn").click(function() {
				map.zoomIn();
			});
			$(".home").click(function() {
				map.flyTo([coords[0], coords[1]], coords[2]);
			});
			$(".zoomOut").click(function() {
				map.zoomOut();
			});
		}

		function populateBar() {
			var contents = '<h3>Cities</h3><ul class="featureList">';
			cities.eachLayer(function(layer) {
				contents += '<li id="' + layer.feature.properties.name + '">' + layer.feature
					.properties.name + '</li>';
			})
			contents += '</ul>';
			$('#bar').append(contents);
		}

		function jqueryInitialize() {
			cities.eachLayer(function(layer) {
				$('#' + layer.feature.properties.name).on({
					'mouseover': function() {
						layer.openPopup()
					},
					'mouseout': function() {
						layer.closePopup()
					}
				});
			})
		}

		function basemapSwitcher() {
			var baseButton = L.control({
				position: 'topright'
			});
			baseButton.onAdd = function(map) {
				var output = L.DomUtil.create('div', 'baseButton');
				$(output).text("Toggle Basemap");
				return output
			}
			baseButton.addTo(map);
			$('.baseButton').click(function() {
				if (map.hasLayer(basemap)) {
					map.removeLayer(basemap);
					map.addLayer(esri_WorldImagery);
				} else {
					map.removeLayer(esri_WorldImagery);
					map.addLayer(basemap);
				}
			})
		}

	});
