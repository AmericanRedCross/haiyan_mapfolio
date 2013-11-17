var windowHeight = $(window).height();
var extentButtons = $("#extentButtons").children();
var sectorButtons = $("#sectorButtons").children();
var visibleExtent = [];
var visibleSectors = [];
var thumbnails;

function toggleFilter (filter, element) {
    // steps if a extent filter is clicked
    if($(element).hasClass("btn-extent")){
        // set global var for extent (only 1 at a time)
        visibleExtent = filter;
        // adjust display of checks and Xs
        // has class "filtering" = active
        $.each(extentButtons, function(i, button){
            var buttonId = $(button).attr("id");
            var buttonSpan = $(button).children();            
            if(buttonId === filter){
                $(buttonSpan).removeClass("glyphicon-unchecked");        
                $(buttonSpan).addClass("glyphicon-check");
                $(button).addClass("filtering");
            } else {
                $(buttonSpan).removeClass("glyphicon-check");
                $(buttonSpan).addClass("glyphicon-unchecked");
                $(button).removeClass("filtering");
            }
        })        
    // steps if sector filter is clicked
    } else {
        if(filter === "refreshSectors"){
            var refreshSectorsSpan = $(element).children();
            $(refreshSectorsSpan).removeClass("glyphicon-unchecked");
            $(refreshSectorsSpan).addClass("glyphicon-check");
            $(element).addClass("filtering");
            $("#sectorButtons").addClass("allOn");                        
            $.each(sectorButtons, function(i,button){
                var buttonSpan = $(button).children();
                $(buttonSpan).removeClass("glyphicon-check");
                $(buttonSpan).addClass("glyphicon-unchecked");
                $(button).addClass("filtering");
            })
        } else {
            $("#refreshSectors").children().removeClass("glyphicon-check");
            $("#refreshSectors").children().addClass("glyphicon-unchecked"); 
            $("#refreshSectors").removeClass("filtering");
            $("#sectorButtons").removeClass("allOn");                                     
            $.each(sectorButtons, function(i,button){
                var buttonId = $(button).attr("id");
                var buttonSpan = $(button).children();
                if(buttonId === filter) {
                    $(buttonSpan).removeClass("glyphicon-unchecked");
                    $(buttonSpan).addClass("glyphicon-check");
                    $(button).addClass("filtering");
                } else {
                    $(buttonSpan).removeClass("glyphicon-check");
                    $(buttonSpan).addClass("glyphicon-unchecked");
                    $(button).removeClass("filtering");
                } 
            })  
        }        
    }
    
    // check to see what which extent is active (only 1 at a time)
    $.each(extentButtons, function(i, button){
        if($(button).hasClass("filtering")){
            var buttonid = $(button).attr("id");
            visibleExtent = buttonid;
        }
    })
    // check to see what sectors are active
    visibleSectors = [];
    $.each(sectorButtons, function(i, button){        
        if($(button).hasClass("filtering")){
            var buttonid = $(button).attr("id");
            visibleSectors.push(buttonid);
        }
    })
    toggleThumbnails();    
}

function refreshFilters (){
    $('#noThumbnails').hide();
    visibleExtent = "ALL";
    $.each(extentButtons, function(i, button){
        var buttonid = $(button).attr("id");
        var buttonSpan = $(button).children();            
        if(buttonid === "ALL"){
            $(buttonSpan).removeClass("glyphicon-unchecked");        
            $(buttonSpan).addClass("glyphicon-check");
            $(button).addClass("filtering");
        } else {
            $(buttonSpan).removeClass("glyphicon-check");
            $(buttonSpan).addClass("glyphicon-unchecked");
            $(button).removeClass("filtering");
        }
    })
    var filter = $("#refreshSectors");
    toggleFilter('refreshSectors', filter);
}

function toggleThumbnails (){
    $(thumbnails).hide();
    $.each(thumbnails, function(iT, thumbnail){        
        $.each(visibleSectors, function(iS, sector){
            if($(thumbnail).hasClass(sector) && $(thumbnail).hasClass(visibleExtent)){
                $(thumbnail).show();
            }
        })
    })
    thumbnailCount = $(thumbnails).filter(function(){return $(this).css('display') === 'block';}).length;
    if (thumbnailCount === 0){
        map.removeLayer(markers);
        $('#noThumbnails').show();
    } else {    
        markersToMap();
    }
}

function callModal (item) {
	var title = $(item).find('.caption').html();
    var description = $(item).find('.detailedDescription').html();
	var thumbSrc = $(item).find('img').attr("src");
    var mapSrc = thumbSrc.replace("_thumb", "");
    var pdfSrc = "pdf" + mapSrc.substring(8).replace(".jpg", ".pdf");
    pdfSrc = pdfSrc.replace(".png", ".pdf");
    var img_maxHeight = (windowHeight*0.60).toString() + "px";
    $(".modal-title").empty();
    $(".modal-detailedDescription").empty();
	$(".modal-title").html(title);
    $(".modal-detailedDescription").html(description); 
    $(".modal-img").css('max-height', img_maxHeight);
    $(".modal-img").attr('src', mapSrc);
	$("#downloadPDF").attr("href", pdfSrc);    
    $('#myModal').modal();    
}

//disclaimer text
function showDisclaimer() {
    window.alert("The maps on this page do not imply the expression of any opinion on the part of the American Red Cross concerning the legal status of a territory or of its authorities.");
}


// MAP SHIT STARTS HERE
var centroids = [];
var markersBounds = [];
var displayedPoints = [];
var markers = new L.MarkerClusterGroup();

var countryStyle = {
    color: '#fff',
    weight: 1,
    fillColor: '#d7d7d8',
    fillOpacity: 1,
    clickable: false
};

var centroidOptions = {
    radius: 8,
    fillColor: "#ED1B2E",
    color: "#FFF",
    weight: 2.5,
    opacity: 1,
    fillOpacity: 1
};

var cloudmadeUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var attribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | &copy; <a href="http://redcross.org" title="Red Cross" target="_blank">Red Cross</a> 2013';
var cloudmade = L.tileLayer(cloudmadeUrl, {attribution: attribution});

var map = L.map('map', {   
    zoom: 0,
    scrollWheelZoom: false,
    layers: [cloudmade]
});
cloudmade.setOpacity(0); 

// change display accordingly to the zoom level
function mapDisplay() {
    var remove = {fillOpacity:0, opacity:0}
    var add = {fillOpacity:1, opacity:1}
    map.on('viewreset', function() {
        if (map.getZoom() < 5) {
            cloudmade.setOpacity(0);
            geojson.setStyle(add);
        } else {
            geojson.setStyle(remove);
            cloudmade.setOpacity(1);
        }
    })
}

// on marker click open modal
function centroidClick (e) {
    var thumbnail_id = "#" + e.target.feature.properties.thumbnail_id;    
    if ($(thumbnail_id).hasClass("ONLINE")) {
        url = $(thumbnail_id).find('a').attr('href');
        window.open(url, '_blank');
    } else {
        callModal(thumbnail_id);
    }    
}

// on marker mouseover
function displayName(e) {   
    var target = e.target;
    target.openPopup();   
}
// on marker mouseout
function clearName(e) {    
    var target = e.target;
    target.closePopup();    
}

// beginning of function chain to initialize map
function getWorld() {
    $.ajax({
        type: 'GET',
        url: 'data/worldcountries.json',
        contentType: 'application/json',
        dataType: 'json',
        timeout: 10000,
        success: function(json) {
            worldcountries = json;
            countries = new L.layerGroup().addTo(map);
            geojson = L.geoJson(worldcountries,{
                style: countryStyle
            }).addTo(countries);
            getCentroids();
        },
        error: function(e) {
            console.log(e);
        }
    });
}

function getCentroids() {
    $.ajax({
        type: 'GET',
        url: 'data/centroids.json',
        contentType: 'application/json',
        dataType: 'json',
        timeout: 10000,
        success: function(data) {
            formatCentroids(data);
            mapDisplay();
            //set intial style based zoom
            var remove = {fillOpacity:0, opacity:0}
            geojson.setStyle(remove);
            cloudmade.setOpacity(1);
            //generate html to display map thumbnails
            generatepreviewhtml(data);
        },
        error: function(e) {
            console.log(e);
        }
    });
}

function formatCentroids(data){
    $.each(data, function(index, item) {
        latlng = [item.longitude, item.latitude];
        var mapCoord = {
            "type": "Feature",
            "properties": {
                "name": item.name,
                "thumbnail_id": item.thumbnail_id,                                        
            },
            "geometry": {
                "type": "Point",
                "coordinates": latlng
            }
        }
        centroids.push(mapCoord);
    }); 
    markersToMap();
}

function markersToMap(){
    map.removeLayer(markers);
    markers = new L.MarkerClusterGroup({showCoverageOnHover:false, spiderfyDistanceMultiplier:3,});
    idList = [];
    displayedPoints=[];
    // build array of visible thumbnail IDs
    //$.each(thumbnails, function (i, thumbnail){
    //    if($(thumbnail).css("display") !== "none"){
    //        idList.push($(thumbnail).attr("id"));
    //    }
    //})
    //$.each(centroids, function (i, centroid){
    //    var centroid_id = centroid.properties.thumbnail_id;
    //    if ($.inArray(centroid_id, idList) !== -1){
    //        displayedPoints.push(centroid);
    //    }        
    //})    
    marker = L.geoJson(centroids, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, centroidOptions);
        },
        onEachFeature: function(feature, layer) {
            var thumbnail_id = "#" + feature.properties.thumbnail_id;
            var popupContent = $(thumbnail_id).find('.caption').html();
            var popupOptions = {
                'minWidth': 30,
                'offset': [0,-10],
                'closeButton': false,
            }; 
            layer.bindPopup(popupContent, popupOptions);
            layer.on({
                click: centroidClick,
                mouseover: displayName,
                mouseout: clearName,
            });   
        }            
    });
    markers.addLayer(marker);
    markers.addTo(map);
    markersBounds = markers.getBounds();
    markersBounds._northEast.lat += 1.5;
    markersBounds._northEast.lng += 1.5;
    markersBounds._southWest.lat -= 1.5;
    markersBounds._southWest.lat -= 1.5;
    map.fitBounds(markersBounds);
} 


$(window).resize(function(){    
    map.fitBounds(markersBounds);    
    windowHeight = $(window).height();
})



// reset map bounds using Zoom to Extent button
function zoomOut() {
    map.fitBounds(markersBounds);
}

// tweet popup
$('.twitterpopup').click(function(event) {
    var width  = 575,
        height = 400,
        left   = ($(window).width()  - width)  / 2,
        top    = ($(window).height() - height) / 2,
        url    = this.href,
        opts   = 'status=1' +
                 ',width='  + width  +
                 ',height=' + height +
                 ',top='    + top    +
                 ',left='   + left;

    window.open(url, 'twitter', opts);

    return false;
});

//generates html for preview boxes using data from centroid.json
function generatepreviewhtml(data){
    var html='<div id="noThumbnails" class="col-sm-12" style="display:none;">'+
          '<h4 style="display:inline;">No maps match the filter settings.</h4>'+
          '<button class="btn btn-default" type="button" style="display:inline; margin-left:20px;" onclick="refreshFilters()">Refresh Filters<span class="glyphicon glyphicon-refresh" style="margin-left:15px;"></span></a>'+
        '</div>';
    $.each(data, function(index, item){
        var itemhtml = '<div id="'+item.thumbnail_id+'" class="col-sm-3 ALL '+item.extent+' '+item.sector+'">' +
          '<a onclick="callModal(this);" class="thumbnail">'+
            '<img src="img/maps/'+item.thumb+'" alt="">'+
            '<div class="caption">'+            
              '<h4>'+item.caption+'<br><small>'+item.date+'</small></h4>'+        
            '</div>'+
            '<div class="detailedDescription">'+item.description+
            '</div>'+
          '</a>'+
        '</div>';
        html=html+itemhtml;
        $('#mappreviews').html(html);
        thumbnails = $(".thumbnailGallery").children();
    });
}

// start function chain to initialize map
getWorld();