var windowHeight = $(window).height();
var extentButtons;
var sectorButtons;
var visibleExtent = [];
var visibleSectors = [];
var thumbnails;
var centroidsData;

function toggleFilter (filter, element) {
    // set both extent and sector to All, when no thumbnails are showing and refresh filters option is clicked
    if(filter === "REFRESH"){
        $.each(extentButtons, function(i, button){
            $(button).children().removeClass("glyphicon-check");
            $(button).children().addClass("glyphicon-unchecked");
            $(button).removeClass("filtering");
        })
        $("#ALL-EXTENT").children().removeClass("glyphicon-unchecked"); 
        $("#ALL-EXTENT").children().addClass("glyphicon-check");
        $("#ALL-EXTENT").addClass("filtering");
        $.each(sectorButtons, function(i, button){
            $(button).children().removeClass("glyphicon-check");
            $(button).children().addClass("glyphicon-unchecked");
            $(button).removeClass("filtering");
        })
        $("#ALL-SECTOR").children().removeClass("glyphicon-unchecked"); 
        $("#ALL-SECTOR").children().addClass("glyphicon-check");
        $("#ALL-SECTOR").addClass("filtering");        
    }
    // steps if a extent filter is clicked
    else if($(element).hasClass("btn-extent")){
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
    // allows for multiple extent filters to be selected
    // for example 'Red Cross' and 'Situational Reports'
    } else {   
        if(filter === "ALL-SECTOR"){
            $.each(sectorButtons, function(i, button){
                $(button).children().removeClass("glyphicon-check");
                $(button).children().addClass("glyphicon-unchecked");
                $(button).removeClass("filtering");
            })
            $("#ALL-SECTOR").children().removeClass("glyphicon-unchecked"); 
            $("#ALL-SECTOR").children().addClass("glyphicon-check");
            $("#ALL-SECTOR").addClass("filtering");         
        } else{
            $("#ALL-SECTOR").children().addClass("glyphicon-unchecked"); 
            $("#ALL-SECTOR").children().removeClass("glyphicon-check");
            $("#ALL-SECTOR").removeClass("filtering");
            // if clicked sector filter is on, then turn it off
            if($(element).hasClass("filtering") === true){
                $(element).removeClass("filtering");
                $(element).children().removeClass("glyphicon-check");
                $(element).children().addClass("glyphicon-unchecked");
                // if no sector filters are turned on, toggle 'All' back on
                var noSectorFiltering = true;
                $.each(sectorButtons, function(i, button){
                    if ($(button).hasClass("filtering")){
                        noSectorFiltering = false;
                    }
                });
                if (noSectorFiltering === true){
                    $("#ALL-SECTOR").children().removeClass("glyphicon-unchecked"); 
                    $("#ALL-SECTOR").children().addClass("glyphicon-check");
                    $("#ALL-SECTOR").addClass("filtering");     
                }
            // if clicked sector filter is off, then turn it on
            } else {
                $(element).addClass("filtering");
                $(element).children().removeClass("glyphicon-unchecked");
                $(element).children().addClass("glyphicon-check");                
            }
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

function toggleThumbnails (){
    $(thumbnails).hide();
    $.each(thumbnails, function(iT, thumbnail){        
        if ($(thumbnail).hasClass(visibleExtent)){        
            var status = true;
            $.each(visibleSectors, function(iS, sector){
                if($(thumbnail).hasClass(sector) === false ){
                    status = false;
                } 
            });
            if (status === true){
                $(thumbnail).show();
            }            
        }
    });
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
    var mapSrc = thumbSrc.slice(0,-10) + '.png';
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
    window.alert("The maps on this page do not imply the expression of any opinion on the part of the British Red Cross, American Red Cross or the International Federation of Red Cross and Red Crescent Societies or National Societies concerning the legal status of a territory or of its authorities.");
}

// map stuff starts here
var centroids = [];
var markersBounds = [];
var displayedPoints = [];
var markers = new L.MarkerClusterGroup();

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
function getCentroids() {
    $.ajax({
        type: 'GET',
        url: 'data/centroids.json',
        contentType: 'application/json',
        dataType: 'json',
        timeout: 10000,
        success: function(data) {
            centroidsData = data;                       
            //generate html to display map thumbnails
            generatepreviewhtml(data);
        },
        error: function(e) {
            console.log(e);
        }
    });
}



//generates html for preview boxes using data from centroid.json
function generatepreviewhtml(data){
    var html='<div id="noThumbnails" class="col-sm-12" style="display:none;">'+
          '<h4 style="display:inline;">No maps match the filter settings.</h4>'+
          '<button class="btn btn-default" type="button" style="display:inline; margin-left:20px;" onclick="toggleFilter('+"'REFRESH'"+', this);">Refresh Filters<span class="glyphicon glyphicon-refresh" style="margin-left:15px;"></span></a>'+
        '</div>';
    function formatDate(date){
        var formattedDate = new Date(date).toString().substring(4,15);
        return formattedDate;
    }
    $.each(data, function(index, item){
        var itemhtml = '<div id="'+item.thumbnail_id+'" class="col-sm-3 ALL-EXTENT ALL-SECTOR '+item.extent+' '+item.sector+'">' +
          '<a onclick="callModal(this);" class="thumbnail">'+
            '<img src="img/maps/'+item.thumb+'" alt="">'+
            '<div class="caption">'+            
              '<h5 style="margin-bottom:-8px; font-weight:bold;">'+item.caption+'</h5><br><p style="font-size:small;">'+ item.description +'<br><small>'+ formatDate(item.date) +'</small></p>'+        
            '</div>'+
            '<div class="detailedDescription">'+item.description+
            '</div>'+
          '</a>'+
        '</div>';
        html=html+itemhtml;        
        var itemExtents = item.extent.match(/\S+/g);
        $.each(itemExtents, function(index, extent){
            if (extentTags.indexOf(extent) === -1){
                extentTags.push(extent);
            }
        });
        var itemSectors = item.sector.match(/\S+/g);
        $.each(itemSectors, function(index, sector){
            if (sectorTags.indexOf(sector) === -1){
                sectorTags.push(sector);
            }
        });
    });
    $('#mappreviews').html(html);
    thumbnails = $(".thumbnailGallery").children();
    generateFilterButtons();
}

function generateFilterButtons(){
    var extentFilterHtml = '<button id="ALL-EXTENT" class="btn btn-small btn-extent filtering" type="button" onclick="toggleFilter('+"'ALL-EXTENT'"+', this);"'+
        ' style="margin-right:10px;">All<span class="glyphicon glyphicon-check" style="margin-left:4px;"></span></button>';
    $.each(extentTags, function(index, tag){
        var itemHtml = '<button id="'+tag+'" class="btn btn-small btn-extent" type="button" onclick="toggleFilter('+"'"+tag+"'"+', this);">'+tag+
            '<span class="glyphicon glyphicon-unchecked" style="margin-left:4px;"></span></button>';
        extentFilterHtml += itemHtml;    
    });
    $('#extentButtons').html(extentFilterHtml);
    extentButtons = $("#extentButtons").children();

    var sectorFilterHtml = '<button id="ALL-SECTOR" class="btn btn-small btn-sector filtering" type="button" onclick="toggleFilter('+"'ALL-SECTOR'"+', this);"'+ 
        'style="margin-right:10px;">All <span class="glyphicon glyphicon-check" style="margin-left:4px;"></span></button>';
    $.each(sectorTags, function(index, tag){
        var itemHtml = '<button id="'+tag+'" class="btn btn-small btn-sector" type="button" onclick="toggleFilter('+"'"+tag+"'"+', this);">'+tag+
            '<span class="glyphicon glyphicon-unchecked" style="margin-left:4px;"></span></button>';
        sectorFilterHtml += itemHtml;
    });
    $('#sectorButtons').html(sectorFilterHtml);
    sectorButtons = $("#sectorButtons").children();
    formatCentroids();
}

// function formatExtentTag(extentTag){
//     if (extentTag === "CW"){
//         return "Country Wide";
//     } else if (extentTag === "TACLOBAN"){
//         return "Tacloban";
//     } else {
//         return extentTag;
//     }
// }

// function formatSectorTag(sectorTag){
//     if (sectorTag === "RC"){
//         return "Red Cross";
//     } else if (sectorTag === "SITREP"){
//         return "Situational Reports";
//     } else {
//         return sectorTag;
//     }
// }

function formatCentroids(){
    $.each(centroidsData, function(index, item) {
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
    markers = new L.MarkerClusterGroup({
        showCoverageOnHover:false, 
        maxClusterRadius: 40   
        // spiderfyDistanceMultiplier:3
    });    
    idList = [];
    displayedPoints=[];
    //build array of visible thumbnail IDs
    $.each(thumbnails, function (i, thumbnail){
       if($(thumbnail).css("display") !== "none"){
           idList.push($(thumbnail).attr("id"));
       }
    })
    $.each(centroids, function (i, centroid){
       var centroid_id = centroid.properties.thumbnail_id;
       if ($.inArray(centroid_id, idList) !== -1){
           displayedPoints.push(centroid);
       }        
    })    
    marker = L.geoJson(displayedPoints, {
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




var extentTags = [];
var sectorTags = [];




// start function chain to initialize map
getCentroids();