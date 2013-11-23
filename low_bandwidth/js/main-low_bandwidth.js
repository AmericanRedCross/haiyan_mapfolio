var extentButtons;
var sectorButtons;
var visibleExtents = [];
var visibleSectors = [];
var extentTags = [];
var sectorTags = [];
var thumbnails;
var windowHeight = $(window).height();

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
    } else {
    // if a filter button is clicked
        var containerId = '#' + $(element).parent().attr('id');
        var sameFilterButtons = $(containerId).children();
        // check if filter is for all
        if($(element).hasClass('all')){
            $.each(sameFilterButtons, function(i, button){
                $(button).children().removeClass("glyphicon-check");
                $(button).children().addClass("glyphicon-unchecked");
                $(button).removeClass("filtering");
            })
            $(element).children().removeClass("glyphicon-unchecked"); 
            $(element).children().addClass("glyphicon-check");
            $(element).addClass("filtering");         
        } else {
            // clear the ALL filter for the filter category
            var sameCategoryAll = $(containerId).find('.all');
            $(sameCategoryAll).children().addClass("glyphicon-unchecked");
            $(sameCategoryAll).children().removeClass("glyphicon-check");
            $(sameCategoryAll).removeClass("filtering");
            
            // if clicked sector filter is on, then turn it off
            if($(element).hasClass("filtering") === true){
                $(element).removeClass("filtering");
                $(element).children().removeClass("glyphicon-check");
                $(element).children().addClass("glyphicon-unchecked");
                // if no sector filters are turned on, toggle 'All' back on
                var noSectorFiltering = true;
                $.each(sameFilterButtons, function(i, button){
                    if ($(button).hasClass("filtering")){
                        noSectorFiltering = false;
                    }
                });
                if (noSectorFiltering === true){
                    $(sameCategoryAll).children().removeClass("glyphicon-unchecked"); 
                    $(sameCategoryAll).children().addClass("glyphicon-check");
                    $(sameCategoryAll).addClass("filtering");     
                }
            // if clicked sector filter is off, then turn it on
            } else {
                $(element).addClass("filtering");
                $(element).children().removeClass("glyphicon-unchecked");
                $(element).children().addClass("glyphicon-check");                
            }
        }
    }
    // check to see what which extents are active
    visibleExtents = [];
    $.each(extentButtons, function(i, button){
        if($(button).hasClass("filtering")){
            var buttonid = $(button).attr("id");
            visibleExtents.push(buttonid);
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
        $(thumbnail).removeClass("mapped");
        var hasExtent = false;
        $.each(visibleExtents, function(iE, extent){
            if($(thumbnail).hasClass(extent)){
                hasExtent = true;
            }
        });
        var hasSectors = true;
        $.each(visibleSectors, function(iS, sector){
            if($(thumbnail).hasClass(sector) === false ){
                hasSectors = false;
            } 
        });
        if(hasExtent === true && hasSectors === true){
            $(thumbnail).show();
            $(thumbnail).addClass("mapped");
        }        
    });
    thumbnailCount = $(thumbnails).filter(function(){return $(this).css('display') === 'block';}).length;
    if (thumbnailCount === 0){        
        $('#noThumbnails').show();
    }
}

//disclaimer text
function showDisclaimer() {
    window.alert("The maps on this page do not imply the expression of any opinion on the part of the British Red Cross, American Red Cross or the International Federation of Red Cross and Red Crescent Societies or National Societies concerning the legal status of a territory or of its authorities.");
}

function callModal (thumbnail) {    
    var description = $(thumbnail).find('.caption').html();
    var previewImgSrc = "img/" + $(thumbnail).find('.pdfButton').attr("href").slice(50,-4) + '(low-quality).jpg';
    var modalPdfButton = $(thumbnail).find('.pdfButtonContainer').html();
    var img_maxHeight = (windowHeight*0.60).toString() + "px";
    $(".modal-detailedDescription").empty();    
    $(".modal-detailedDescription").html(description); 
    $(".modal-img").css('max-height', img_maxHeight);
    $(".modal-img").attr('src', previewImgSrc);
    $(".modalPdfButton").html(modalPdfButton);    
    $('#myModal').modal();    
}

// beginning of function chain
function getCentroids() {
    $.ajax({
        type: 'GET',
        url: '../data/centroids.json',
        contentType: 'application/json',
        dataType: 'json',
        timeout: 10000,
        success: function(data) {                             
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
        var pdfSrc = 'https://s3-us-west-2.amazonaws.com/arcmaps/haiyan/' + item.thumb.slice(0,-10) + '.pdf';
        var smallPdf = '';
        if(item.small_pdf == "TRUE"){
            smallPdf = '<a href="'+pdfSrc.slice(0,-4)+'(small).pdf'+'" target="_blank" style="margin:2px;" class="btn btn-primary btn-mini">Reduced-size PDF ('+item.small_pdf_size+')</a>'; 
        }
        var itemhtml = '<div id="'+item.thumbnail_id+'" style="display:none," class="ALL-EXTENT ALL-SECTOR mapped '+item.extent+' '+item.sector+'">' +
            '<div class="row thumbnail" style="min-height:0; margin-left:0; margin-right:0; padding:10px">'+            
                '<div class="caption col-sm-8" style="padding:0;">'+            
                    '<h5 style="margin:0; font-weight:bold;">'+item.title+'</h5>'+
                    '<p style="font-size:small; margin:0;">'+ item.description_long +'</p>'+
                    '<p style="font-size:small; margin:6px 0 0 0;">'+ formatDate(item.date) +'</p>'+        
                '</div>'+           
                '<div class="col-sm-4">'+
                    '<div class="pdfButtonContainer">'+
                        '<a href="' + pdfSrc + '" target="_blank" style="margin:2px;" class="pdfButton btn btn-primary btn-mini">Download PDF (' + item.pdf_MB.toString() + ' MB)</a>'+
                        smallPdf +
                    '</div>' +
                    '<button type="button" onclick="callModal(' + item.thumbnail_id + ');" class="btn btn-link btn-mini">Preview low-quality JPG</button><br>' +
                '</div></div></div>';
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
    extentTags.sort();
    var extentFilterHtml = '<button id="ALL-EXTENT" class="btn btn-small btn-extent filtering all" type="button" onclick="toggleFilter('+"'ALL-EXTENT'"+', this);"'+
        ' style="margin-right:10px;">All<span class="glyphicon glyphicon-check" style="margin-left:4px;"></span></button>';
    $.each(extentTags, function(index, tag){
        var itemHtml = '<button id="'+tag+'" class="btn btn-small btn-extent" type="button" onclick="toggleFilter('+"'"+tag+"'"+', this);">'+tag+
            '<span class="glyphicon glyphicon-unchecked" style="margin-left:4px;"></span></button>';
        extentFilterHtml += itemHtml;    
    });
    $('#extentButtons').html(extentFilterHtml);
    extentButtons = $("#extentButtons").children();

    sectorTags.sort();
    var sectorFilterHtml = '<button id="ALL-SECTOR" class="btn btn-small btn-sector filtering all" type="button" onclick="toggleFilter('+"'ALL-SECTOR'"+', this);"'+ 
        'style="margin-right:10px;">All <span class="glyphicon glyphicon-check" style="margin-left:4px;"></span></button>';
    $.each(sectorTags, function(index, tag){
        var itemHtml = '<button id="'+tag+'" class="btn btn-small btn-sector" type="button" onclick="toggleFilter('+"'"+tag+"'"+', this);">'+tag+
            '<span class="glyphicon glyphicon-unchecked" style="margin-left:4px;"></span></button>';
        sectorFilterHtml += itemHtml;
    });
    $('#sectorButtons').html(sectorFilterHtml);
    sectorButtons = $("#sectorButtons").children();
    // formatCentroids();
    $(function() {
        $("img.lazy").lazyload({
            effect: "fadeIn"
        });
    });
}



// start function chain to initialize map
getCentroids();