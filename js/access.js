$(function() {
	$(".accessVid").each(function(){
			accessVideo({vidContainer:$(this)})
	})
})

var p=0

function accessVideo(setup){
	
	/* Browser detection is changing in jQuery, update here when required */
	var MSIE = jQuery.browser.msie
	var OPERA = jQuery.browser.opera
	var SAFARI = jQuery.browser.safari
	/* change stopButton to true if you would like to include a stop button */
	/*var stopButton = false*/
	
	
	$.browser.chrome = /chrome/.test(navigator.userAgent.toLowerCase()); 
	if($.browser.chrome){
		SAFARI = false
	}	
	/***********************************************************************/
	
	var VO = {

			audioTrack:(setup.vidContainer.find('audio').length == 1)?  true:  false,
	  	  	vObject:setup.vidContainer.find("video").get(0),  //setup.vObj,
			vidContainer: setup.vidContainer,
			audioObject:(setup.vidContainer.find('audio').length == 1)?  setup.vidContainer.find('audio').get(0):  false,
			dialogOpen:false,
			subtitlesStartPosition:"",

			init:function(){
					$.ajax({
						type: "GET",
						url: VO.vidContainer.find("track").attr("src"),
						//dataType: "html",
						success: function(xml){
							//When running the local version of the site Firefox will get to this point in the code and Flash/HTML will not initialise. Below is a workaround.
							//If the xml document does not have content and returns [object XMLDocument] put the Flash version on the page.
							if(xml=="[object XMLDocument]"){
								VO.goFlash()
							}else{
								//Page is running on a server and is HTML5 enabled.
								if(MSIE){
									$(VO.vObject).css("height", $(VO.vObject).parent().css("height") )
									$(VO.vObject).css("width", $(VO.vObject).parent().css("width") )
								}
								
								VO.DoSubs(xml, "subtitles")
								VO.setupSeeking()
								VO.CreateCaptionSettings(VO.vidContainer)
								
								document.addEventListener("focus", function(event) {
									if (VO.dialogOpen && !VO.vidContainer.get(0).contains(event.target)) {
										event.stopPropagation();
										VO.vidContainer.find("video").focus();
									}							
								}, true);
									
								document.addEventListener("keyup", function(event) {
									if (VO.dialogOpen && event.keyCode == 27) {
										VO.dialogOpen = false
									}
								}, true);
							
								VO.vidContainer.on("click touchend", function(){window.activeVideo = VO.vidContainer;})
								VO.vidContainer.find("video").on("click touchend", function(){VO.playPauseVid()}).on("keypress", function(e){
									if(e.which == 112 || e.which == 13){
										VO.playPauseVid()
									}
									if(e.which == 45){VO.volVidDown()}
									if(e.which == 43 || e.which == 61){VO.volVidUp()}
	
	
								}).on("keydown", function(e){
									if(e.which == 37){VO.stepBackwardVid()}
									if(e.which == 39){VO.stepForwardVid()}	
								})
								
								if(!OPERA && !MSIE){
									VO.vidContainer.toggle($(document).fullScreen() != null);
																						
									$(document).bind("fullscreenchange", function(e){
											//Show video height and width at 100% 
											VO.vidContainer.toggleClass("FullScreen")
											//Reposition the video controls.
											VO.vidContainer.find(".vidControls").toggleClass("positionControlsFullScreen")		 
											VO.vidContainer.find(".SubtitleContainer").toggleClass("positionSubtitlesFullScreen")
									});
								}	
							}
													
						  },
						  error: function() {
							  //If the browser is HTML5 enabled but page is running locally show the Flash version so captions can still be displayed.
							  VO.goFlash()
							}
					});		

			}, //init()
			 
		  	 setupSeeking:function(){

	  				VO.setupControls()
					
					VO.vidContainer.find( ".slider" ).slider({
						max:VO.vObject.duration,
						min:0,
						create: VO.sliderInitialised = true
					});
					
					VO.vidContainer.find(".slider").addClass("ui-slider-background-colour")

					
					VO.vidContainer.find(".slider").on("mousedown", function(){
						VO.pauseVid()}
					).on("mouseup", function(){
						VO.vObject.currentTime = VO.vidContainer.find(".slider").slider('value');
						VO.playVid()
					}).on("keyup", function(event){
						VO.processKeyUpEvents(event.which, VO.vObject)						
						//this lets the screen reader know to process the object differently, otherwise the link on the anchor tag is read out.
						$(this).find("a").attr("role","slider")
						$(this).find("a").attr("aria-label","Label Scrub bar position is at " +VO.vObject.currentTime+" seconds.")
											
						//This is triggered by the mouse only, not the keyboard
						$(this).find("a").attr("aria-valuetext","value text Scrub bar position is at " +VO.vObject.currentTime+" seconds.")
													  
					})
					
					//set the initial volume of the video and audio description
					VO.vObject.volume = .7
		 			VO.volAudioVideoMatch()  
			 }, //setupSeeking
					
		sliderInitialised:false,	
		timedInterval:null,		
		setupControls:function(){
						
			VO.vidContainer.append("<div class='vidControls'>\
				<button class='vidPlayPause' aria-controls='vidControls'>Play</button>\
				<button class='vidStop' aria-controls='vidControls'>Stop</button>\
				<button class='vidStepBackward' aria-controls='vidControls'>Step Backward</button>\
				<button class='vidStepForward' aria-controls='vidControls'>Step Forward</button>\
				<div class='slider' role='slider' aria-valuemin='0' aria-valuemax='100' aria-valuenow='0' aria-valuetext='0 minutes and 0 seconds' title='Video seek'></div>\
				<button class='vidVolDown' aria-controls='vidControls'>Volume down</button>\
				<button class='vidVolUp' aria-controls='vidControls'>Volume up</button>")
			
			//Opera and IE don't support fullscreen so the fullscreen button is not shown
			if(!OPERA && !MSIE && !SAFARI){VO.vidContainer.find(".vidControls").append("<button class='vidFullscreen' aria-controls='vidControls'>Fullscreen</button>")}
			
			VO.vidContainer.find(".vidControls").append("<button class='ShowCaptions' aria-controls='vidControls'>Captions</button>\
				<button class='ShowSettings' aria-controls='vidControls'>Caption Settings</button>")
			
			//Don't show the audioDescription button if there is no audio track
			if(VO.audioTrack){VO.vidContainer.find(".vidControls").append("<button class='AudioDescriptionTrack' aria-controls='vidControls'>Audio Description</button>")}
			
			VO.vidContainer.find(".vidControls").append("</div>")
			
				VO.vidContainer.find(".vidPlayBut").on("click touchend", function(){VO.playVid()})
				VO.vidContainer.find(".vidPlayPause").on("click touchend", function(){VO.playPauseVid()})
				VO.vidContainer.find(".vidPause").on("click touchend", function(){VO.pauseVid()})
				VO.vidContainer.find(".vidStop").on("click touchend", function(){VO.stopVid()})
				VO.vidContainer.find(".vidStepForward").on("click touchend", function(){VO.stepForwardVid()})
				VO.vidContainer.find(".vidStepBackward").on("click touchend", function(){VO.stepBackwardVid()})
				VO.vidContainer.find(".vidVolDown").on("click touchend", function(){VO.volVidDown() })           
				VO.vidContainer.find(".vidVolUp").on("click touchend", function(){VO.volVidUp()})
				VO.vidContainer.find(".vidFullscreen").on("click touchend", function(){VO.Fullscreen()})
				VO.vidContainer.find(".ShowCaptions").on("click touchend", function(){VO.showCaptions()})
				VO.vidContainer.find(".ShowSettings").on("click touchend", function(){VO.showSettings()})
				VO.vidContainer.find(".AudioDescriptionTrack").on("click touchend", function(){VO.AudioDescription()})			
				
		}, //setupControls
		
		playVid:function(){
			 VO.stopTimer()
			 VO.vObject.play()
			 VO.audioPlay()
			 VO.startTimer()
			 VO.setPlayPauseVal("Pause")
			 VO.switchPlayPauseImage("Pause")
		}, //end playVid
		
		 pauseVid:function(){	
		  VO.stopTimer()
		  VO.audioStop()
		  VO.vObject.pause()
		  VO.setPlayPauseVal("Play")
		  VO.switchPlayPauseImage("Play")
		}, //end pauseVid
				
		 playPauseVid:function(){
		 
		  if(VO.vObject.paused){		   
			VO.audioPlay()
			VO.playVid()
			VO.switchPlayPauseImage("Pause")
  		  }else{
			  VO.audioStop()
			  VO.pauseVid()	
		 	VO.switchPlayPauseImage("Play")
		  }
	  }, //playPauseVid
		
	stopVid:function(){	
	  VO.stopTimer()
	  VO.vObject.pause()
	  VO.setCurrentTime(0)
	  VO.showTime()
	  VO.setPlayPauseVal("Play")
	  VO.switchPlayPauseImage("Play")
	  VO.audioStop()
	  }, //stopVid
		
	stepForwardVid:function (){
		VO.vObject.currentTime +=3
		setTimeout(function(){VO.syncTracks()},1000)
		VO.showTime()	
	}, //stepForwardVid
	
	stepBackwardVid:function (){
		VO.vObject.currentTime -=3
		setTimeout(function(){VO.syncTracks()},1000)
		VO.showTime()
	}, //stepBackwardVid
	  
	  volVidUp:function(){
		try{VO.vObject.volume += .1}
		catch(err){VO.vObject.volume = 1}
		  VO.volAudioVideoMatch()  
	  },//volVidUp
	  
	  volVidDown:function(){
		try{VO.vObject.volume -= .1}
		catch(err){VO.vObject.volume = 0}
		  VO.volAudioVideoMatch()  
	  }, //volVidDown
	  
	  volAudioVideoMatch:function(){
		  VO.audioObject.volume = VO.vObject.volume
	  },//volAudioVideoMatch
	
	  showTime:function (){ 
	  	/* To show time use this method: $("#textdisplayobject").text(VO.formatTime(VO.vObject.currentTime))*/
		 VO.updateProgressBar()
	  }, //showTime
	  
	  updateProgressBar:function(){		  
		 if( VO.sliderInitialised){
			VO.vidContainer.find( ".slider" ).slider( "option", "value", VO.vObject.currentTime );
		 }
	  },//updateProgressBar
	  
	  setPlayPauseVal:function(val){
		  VO.vidContainer.find(".vidPlayPause").text(val)
		  VO.vidContainer.find(".vidPlayPause").attr("title",val)
	  }, //setPlayPauseVal
	  
	  startTimer:function(){
		 VO.timedInterval= window.setInterval(function(){VO.showTime()},100)
	  }, //startTimer
	  
	  stopTimer:function(){
		  VO.timedInterval= window.clearInterval(VO.timedInterval)
	  }, //stopTimer
	  
	  setCurrentTime:function (T){
		  VO.vObject.currentTime = T
	  }, //setCurrentTime
	
	 formatTime:function (sec) { 
		var mini = Math.floor(sec/60);        
		sec -= mini*60;        
		if (sec<10){ 
			var sec_str = "0" + Math.round(sec); 
		}else{ 
			sec_str = Math.round(sec);
		}
		if (mini<10){
			var min_str= "0" + Math.round(mini); 
		}else{
			min_str = Math.round(mini);
		}
		var time = min_str + ":" + sec_str;        
		return time;
	}, //formatTime
		
	Fullscreen:function(){
		
		if($(document).fullScreen()==false){
			VO.dialogOpen = true
			$(VO.vidContainer).fullScreen(true)
			
		}else{
			VO.dialogOpen = false
			$(VO.vidContainer).fullScreen(false)
			//return the subtitles to the original position - saves them flying off the screen.
			VO.vidContainer.find(".SubtitleContainer").css("top",VO.subtitlesStartPosition[0])
			VO.vidContainer.find(".SubtitleContainer").css("left", VO.subtitlesStartPosition[1])
		}
	}, //Fullscreen

	processKeyUpEvents:function(key, vidObj){
		//function works specifically on the scrub bar slider.
		if(key==39 || key==37){
			VO.pauseVid()
			VO.vObject.currentTime = VO.vidContainer.find(".slider").slider('value');
		}
		if(key==32 || key==13){
			//playVid()
		}
	},// processKeyUpEvents
	
	AudioDescription:function(){
		if(VO.enableSecondAudioTrack){
			VO.audioStop()
			VO.enableSecondAudioTrack = false
			VO.vidContainer.find(".AudioDescriptionTrack").removeClass("buttonHighlightColour")
		}else{
			VO.enableSecondAudioTrack = true
			VO.audioPlay()
			VO.vidContainer.find(".AudioDescriptionTrack").addClass("buttonHighlightColour")
		}
		
	},//AudioDescription
	
	enableSecondAudioTrack:false,
		
	audioPlay:function(){
		if(VO.audioTrack && VO.enableSecondAudioTrack && !VO.vObject.paused ){
			setTimeout(function(){VO.syncTracks()},100)
			VO.audioObject.play()
		}
	}, //audioPlay
	
	audioStop:function(){
		if(VO.audioTrack && VO.enableSecondAudioTrack){
			setTimeout(function(){VO.syncTracks()},100)
			VO.audioObject.pause()
		}
	}, //audioStop
	
	syncTracks:function(){
	  VO.audioObject.currentTime = VO.vObject.currentTime;
	},//syncTracks
 
	CreateCaptionSettings:function(attachTo, textField){
		VO.createSubtitleContainer(attachTo)
		VO.subtitlesStartPosition = [VO.vidContainer.find(".SubtitleContainer").css("top"), VO.vidContainer.find(".SubtitleContainer").css("left")]
		if($("body #CaptionSettings").length==0){
			$("body").append("<div id='CaptionSettings' />")	
			$("#CaptionSettings").prepend("<div class='ColourSelector'>Foreground</div>")
			VO.addCaptionSettings($("#CaptionSettings"))
			VO.createColourPickers()
			VO.createTransparencySettings()
			VO.createFontSelector()
			VO.createSubtitleExample($("#CaptionSettings"))
		}			
	}, //CreateCaptionSettings
	
	addCaptionSettings:function(attachTo){	
		attachTo.append("<div class='TransparencySettings'>"+
			   " Background transparency: "+
			   " <input id='ZeroPercent' type='radio' name='Transparency' value='0 percent'><label for='ZeroPercent'>0%</label>"+
			   " <input id='TwentyFivePercent' type='radio' name='Transparency' value='25 percent'><label for='TwentyFivePercent'>25%</label>"+
			   " <input id='FiftyPercent' type='radio' name='Transparency' value='50 percent'><label for='FiftyPercent'>50%</label>"+
			   " <input id='SeventyFivePercent' type='radio' name='Transparency' value='75 percent' checked><label for='SeventyFivePercent'>75%</label>"+
			   " <input id='OneHundredPercent' type='radio' name='Transparency' value='100 percent'><label for='OneHundredPercent'>100%</label>"+
		   " </div>"+
		   " <div class='FontType'>"+
			"    <label for='ChooseFont'>Font:</label>"+
			"    <select id='ChooseFont'>"+
			"      <option value='Arial'>Arial</option>"+
			"      <option value='Century Gothic'>Century Gothic</option>"+
			"      <option value='Georgia'>Georgia</option>"+
			"      <option value='Times New Roman'>Times New Roman</option>"+
			"      <option value='Verdana'>Verdana</option>"+
			 "   </select>    "+
			"</div>"+
		   " <div class='FontSize'>"+
		   " Size:   <button class='IncreaseFontSize' title='Increase Font Size'>+</button>"+
		   "         <button class='DecreaseFontSize' title='Decrease Font Size'>-</button>"+
		   " </div>")
		
		$("#CaptionSettings").find(".IncreaseFontSize").on("click", function(){VO.IncreaseFontSize()})
		$("#CaptionSettings").find(".DecreaseFontSize").on("click", function(){VO.DecreaseFontSize()})
		
	}, //addCaptionSettings
	
	
	createColourPickers:function(){
		for(var i=0; i< VO.getColour().length; i++){
			$("#CaptionSettings").find(".ColourSelector").append("<button class='picker' tabindex='0'>"+'Foreground' + VO.getColour()[i]+"</button>")
		}
		$(".ColourSelector").append("<br/><br/>Background")
		for(var i=0; i< VO.getColour().length; i++){
			$("#CaptionSettings").find(".ColourSelector").append("<button class='pickerBG' tabindex='0'>"+'Background' + VO.getColour()[i]+"></button>")
		}
		
		$(".picker").each(function(i){
			//set the colour of every picker
			$(this).css("background-color", VO.getColour()[i])
				$(this).on('click', function(){		
					VO.setSubtitleStyle(window.activeVideo.find(".SubtitleText"),$("#CaptionSettings").find(".SubtitleTextEx"), "color",	$(this).css("background-color"))
				}).on('keydown', function(e){
					if (e.which == 32) {
						VO.setSubtitleStyle(window.activeVideo.find(".SubtitleText"),$("#CaptionSettings").find(".SubtitleTextEx"), "color",	$(this).css("background-color"))
					  }  
				})
			})
			
		$(".pickerBG").each(function(i){
			//set the colour of every picker
			$(this).css("background-color", VO.getColour()[i])
			$(this).on('click', function(){	
					VO.setSubtitleStyle(window.activeVideo.find(".SubtitleTextBG"),$("#CaptionSettings").find(".SubtitleTextBGEx"), "background-color", $(this).css("background-color"))
				}).on('keydown', function(e){
					if (e.which == 32) {
						VO.setSubtitleStyle(window.activeVideo.find(".SubtitleTextBG"),$("#CaptionSettings").find(".SubtitleTextBGEx"), "background-color", $(this).css("background-color"))
					  }  
				})
			})
			
		$("#CaptionSettings").find(".ColourSelector").append("<br/><br/>Colour")
		$("#CaptionSettings").find(".ColourSelector").append("<button class='pickerSetBlackWhite' tabindex='0'>Black White</button>")
		$("#CaptionSettings").find(".ColourSelector").append("<button class='pickerSetWhiteBlack' tabindex='0'>White Black</button>")
		$("#CaptionSettings").find(".ColourSelector").append("<button class='pickerSetBlackYellow' tabindex='0'>Black Yellow</button>")
		$("#CaptionSettings").find(".ColourSelector").append("<button class='pickerSetBlueWhite' tabindex='0'>Blue White</button>")
	
		$("#CaptionSettings").find(".pickerSetBlackWhite, .pickerSetWhiteBlack, .pickerSetBlackYellow, .pickerSetBlueWhite ").on("click", function(){
			VO.setSubtitleStyle(window.activeVideo.find(".SubtitleTextBG"),$("#CaptionSettings").find(".SubtitleTextBGEx"), "background-color",	$(this).css("background-color"))
			VO.setSubtitleStyle(window.activeVideo.find(".SubtitleText"), $("#CaptionSettings").find(".SubtitleTextEx"), "color",	$(this).css("color"))
			
		}).on('keydown', function(e){
			if (e.which == 32) {
				VO.setSubtitleStyle(VO.vidContainer.find(".SubtitleTextBG"),$("#CaptionSettings").find(".SubtitleTextBGEx"), "background-color",	$(this).css("background-color"))
				VO.setSubtitleStyle(VO.vidContainer.find(".SubtitleText"),$("#CaptionSettings").find(".SubtitleTextEx"), "color",	$(this).css("color"))
			 }  
		})
		
	}, //createColourPickers
		
	IncreaseFontSize:function(){
		var currentFontSize = parseInt(window.activeVideo.find(".SubtitleText").css("font-size"))
		currentFontSize+=2
		VO.setSubtitleStyle(window.activeVideo.find(".SubtitleText"),$("#CaptionSettings").find(".SubtitleTextEx"), "font-size",	currentFontSize)
	},//IncreaseFontSize
	
	 DecreaseFontSize:function(){
		var currentFontSize = parseInt(window.activeVideo.find(".SubtitleText").css("font-size"))
		if(currentFontSize >10){
			currentFontSize-=2
			VO.setSubtitleStyle(window.activeVideo.find(".SubtitleText"),$("#CaptionSettings").find(".SubtitleTextEx"), "font-size",	currentFontSize)
		}
	}, //DecreaseFontSize
	
	 getColour:function(i){
		return ["White","Black","Red","Yellow","Lime","Aqua","Blue","Fuchsia"]
	}, //getColour
	
	 showSettings:function(){
		 var wasFullscreen
		 if($(document).fullScreen()){
			 wasFullscreen = true
			 $(document).fullScreen(false)
		}
		$("#CaptionSettings").dialog({
			modal: true,
			buttons: {
				Ok: function() {
					$(this).dialog( "close" );
					checkFS()
				}				
			},
			close:function(){checkFS()},
			title:"Caption settings"
		})
		function checkFS(){
			if(wasFullscreen == true){						
				$(VO.vidContainer).fullScreen(true)
				wasFullscreen = false
			}		
		}
		$("#CaptionSettings").dialog("option", "width", 500)
		$("#CaptionSettings").dialog("option", "height", 420)
		$("#CaptionSettings").dialog("option", "position", "center")
	
	},//showSettings
	
	 showCaptions:function(){
		var c = VO.vidContainer.find(".SubtitleContainer")
		var b = (c.css("display") == "block")? "none" : "block"
		c.css("display", b)
	}, //showCaptions
	
	 createSubtitleContainer:function(){
		VO.vidContainer.append("<div class='SubtitleContainer'>"+
			"	<div class='SubtitleTextBG'></div>"+
			"	<div class='SubtitleText' tabindex='0'></div>"+
			"</div>")			
			VO.vidContainer.find(".SubtitleContainer" ).draggable({ containment: VO.vidContainer, scroll: false });
			VO.vidContainer.find(".SubtitleContainer" ).resizable();
	}, //createSubtitleContainer
	
	 createSubtitleExample:function(attachTo){
			attachTo.append("<div class='SubtitleContainerEx'>"+
			"	<div class='SubtitleTextBGEx'></div>"+
			"	<div class='SubtitleTextEx'><p>Here is some example text.</p></div>"+
			"</div>")
	}, //createSubtitleExample	
	 createTransparencySettings:function(){
		$("#CaptionSettings").find(".TransparencySettings").find("input").on("click", function(){		
			VO.setSubtitleStyle(window.activeVideo.find(".SubtitleTextBG"), $("#CaptionSettings").find(".SubtitleTextBGEx"), "opacity", parseInt($(this).attr("value"))/100)
		})
	}, //createTransparencySettings
	
	 createFontSelector:function(){
		$("#CaptionSettings").find("#ChooseFont").change(function () {
			  $(this).find("option:selected").each(function(){
					VO.setSubtitleStyle(window.activeVideo.find(".SubtitleText"), $("#CaptionSettings").find(".SubtitleTextEx"), "font-family", $(this).text()+", sans-serif")
			   });
			})//.trigger('change');	
	}, //createFontSelector

	
	setSubtitleStyle:function (obj, obj2, CSS1, CSS2){
		obj.css(CSS1,CSS2)
		if(obj2){
			obj2.css(CSS1,CSS2)
		}
	},//setSubtitleStyle
	
	 switchPlayPauseImage:function(stateOfPlay){
		if(stateOfPlay == "Play"){
			 VO.vidContainer.find(".vidPlayPause").removeClass("paused")
		}else{
			 VO.vidContainer.find(".vidPlayPause").addClass("paused")
		}
	},//switchPlayPauseImage
	
	
	DoSubs:function (trContent, trType){
				
			//default type = subtitles.
			 var patternID = /^([0-9]+)$/; 			
			 if(trType == 'chapters'){patternID = /^chapter-([0-9])+$/; }
			
			var TCpatt = /^([0-9]{2}:[0-9]{2}:[0-9]{2}[,.]{1}[0-9]{3}) --\> ([0-9]{2}:[0-9]{2}:[0-9]{2}[,.]{1}[0-9]{3})(.*)$/;
			var sub_line = trContent.split(/\r?\n/);
			
			var subs_and_timing = new Array();
			for(i = 0; i<sub_line.length; i++) {
				identifier = patternID.exec(sub_line[i])
				
				i++;
				var TC = TCpatt.exec(sub_line[i])
				if(TC && i<sub_line.length){
					i++;
					var text = sub_line[i];
					i++;
					while(sub_line[i] != '' && i<sub_line.length){
						text = text + '<br />' + sub_line[i];
						i++;						
					}							
					subs_and_timing.push({
						'start': VO.convertSec(TC[1]),
						'stop': VO.convertSec(TC[2]),
						'text': text
					});
				}
  			}
		
			transcript = ""
			VO.showSubtitles(subs_and_timing)
			VO.createTranscript(subs_and_timing)		
		}, //showSubtitles
		
		createTranscript:function(SAT){
			
			VO.vidContainer.prepend("<div class='transcript'><p><strong>Video transcript:</strong></p></div>")
			var transContainer = VO.vidContainer.find(".transcript")
			
			transContainer.append("<p>")
			
			for (var t=0; t<SAT.length; t++){
				
				VO.vidContainer.find(".imagesForTranscript").find("span").each(function(){
					if(SAT[t+1]){
						if(parseInt($(this).text()) < parseInt(SAT[t+1].start)){
							$(this).find("img").appendTo(transContainer)
						}
					}
				})
				
				transContainer.append(SAT[t].text + " ")

				if(SAT[t].text.indexOf(".") > 0 || SAT[t].text.indexOf("!") > 0 || SAT[t].text.indexOf("?") > 0){
					transContainer.append("<p>")					
				}
				
			}
			transContainer.append("<p><strong>End video transcript.</strong></p>")
		},//createTranscript
		

		showSubtitles :function(subs_and_timing){	
		
			VO.vObject.addEventListener('timeupdate', function(){
				for(var i = 0; i < subs_and_timing.length; i++){		
					if(this.currentTime >= subs_and_timing[i].start && this.currentTime <= subs_and_timing[i].stop){
						break
					}
				}
			
				if(i > subs_and_timing.length-1 ){
					VO.vidContainer.find(".SubtitleText").html("<p>-</p>")
				}else if(this.currentTime >=subs_and_timing[i].start && this.currentTime <= subs_and_timing[i].stop){
					VO.vidContainer.find(".SubtitleText").html(subs_and_timing[i].text ) 
				}
			}, false);	
		}, //showSubtitles
		
		
		convertSec:function(TC){
			var t = TC.split(':');
			return t[0]*60*60 + t[1]*60 + parseFloat(t[2].replace(',','.'));
		},//convertSec
		
		videoDetect:function(content){	
			if($.browser.webkit || $.browser.mozilla){				
				content.find("video").each(function(){
					$(this).find("source").attr("src", 	$(this).find("source").attr("src").replace(".mp4", ".webm"))
					$(this).find("source").attr("type", $(this).find("source").attr("type").replace("mp4", "webm"))
				})
			}
			return content.html()
		},//videoDetect
		
		goFlash:function(){
			var playerSource, vidSource, captionSource, controlsSource, skinColour;
			
			skinColour = "0x222222"
			
			$(VO.vidContainer).find(".FlashPlayer").each(function(){
				//find the required file location information and strip out the spaces.
				playerSource = $(this).find(".videoPlayerLocation").text().replace(/\s+/g, '');
				controlsSource = $(this).find(".videoPlayerControlsLocation").text().replace(/\s+/g, '');
				captionSource = $(this).find(".videoCaptionsFileLocation").text().replace(/\s+/g, '');
				vidSource = $(this).find(".videoSourceFileLocation").text().replace(/\s+/g, '');
				if($(this).find(".videoControlsColour").text().replace(/\s+/g, '') != ""){
					skinColour =  $(this).find(".videoControlsColour").text().replace(/\s+/g, '').replace("#","0x");
				}
			})
			
			//Must have unique IDs on a HTML page, this should produce enough unique identifiers - but in rare cases could be an issue - refreshing page should fix the problem of same ID.
			var uniqueID = "Video" + parseInt(Math.random() * 10000)

			//Need to create a custom id for the myContent ID.
			$("<div class='accessVid'><div id='"+uniqueID+"'></div></div>").insertAfter($(VO.vidContainer))
			
			var params = { allowscriptaccess: 'always', allowfullscreen: true};
			swfobject.embedSWF(playerSource+"?videoSource="+vidSource+"&Captions="+captionSource+"&videoSkin="+controlsSource+"&SkinColour="+skinColour, uniqueID, parseInt($(".accessVid").width()), $(".accessVid").height()*1.125, "9.0.0", "expressInstall.swf","", params);
			
			//strip out the original video container so HTML5 browsers don't show the HTML5 video and the Flash video.
			$(VO.vidContainer).remove()
		
		} //goFlash
		
	}//VO
	try
	{	
		VO.vObject.addEventListener('loadedmetadata', function() {
			//HTML5 enabled browsers
			VO.init()
		})
	
	}
	catch(err)
	{
		//IE doesn't recognise the loadedmetadata event or HTML5 - it loads the Flash version.
		VO.goFlash()
	}
	
	
	window.activeVideo = ""
	return VO
	
}

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {         
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

Array.prototype.startAndEndTimes = function(){
	var startTimes = this[0].split(':');
	var endTimes = this[1].split(':');
	var times = new Array()
	times[0] = startTimes[0]*60*60 + startTimes[1]*60 + parseFloat(startTimes[2].replace(',','.'));
	times[1] = endTimes[0]*60*60 + endTimes[1]*60 + parseFloat(endTimes[2].replace(',','.'));
	return times
}

Array.prototype.getTimes = function(){
	var times = []
	var completeTimes = []
	for(i = 0; i<this.length; i++) {
		//look only for the time codes
		if(this[i].indexOf(" --> ") >-1){							
			//split each time pair into the times array			
			times[i] = this[i].split(" --> ")
			completeTimes.push(times[i].startAndEndTimes())
		}
	}
	return completeTimes
}

Array.prototype.getSubtitles = function (){
	var subs = []
	for(i = 0; i<this.length; i++) {
		//ignore the time codes
		if(this[i].indexOf(" --> ") == -1){
			//if it isn't a whole number (which is a line number in .vtt files push it into the array.
			if(this[i].search(/^\s*\d+\s*$/) == -1){
				subs.push(this[i])				
			}
		}
	}	
	return subs
}
