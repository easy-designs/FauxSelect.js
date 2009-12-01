/* DOM Loaded Event Handling
   by Dean Edwards, Matthias Miller, and John Resig
   with a little Simon Willison sprinkled in */
var init = function (){
  // kill the timer (if it exists)
  if( typeof( _timer ) != 'undefined' ){
    clearInterval( _timer );
    _timer = null;
  }

  for( var ii=0; arguments.callee.actions.length > ii; ii++ )
    arguments.callee.actions[ii]();
};
init.actions = [];

/*@cc_on
  /*@if (@_win32)
  document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
  var script = document.getElementById("__ie_onload");
  script.onreadystatechange = function() {
    if( this.readyState == 'complete' ){
      init();
    }
  };
  @else @*/
  // Safari
  if( /WebKit/i.test( navigator.userAgent ) ){
    var _timer = setInterval( function(){
      if( /loaded|complete/.test( document.readyState ) ){
        init();
      }
    }, 10);
  }
  // Mozilla/Opera
  else if( document.addEventListener ){
    document.addEventListener( 'DOMContentLoaded', window.init, false );
  }
  // everyone else
  else {
    Event.observe( window, 'load', init, false );
  }
  /*@end
@*/

// -- ENABLE TRACING USING jsTrace -- //
var trace;
if( typeof( jsTrace ) != 'undefined' ){
  trace = function( msg ){
    jsTrace.send( msg );
  };
} else {
  trace = function( ){ };
}

// if Prototype, selects & required DOM methods are available
if( typeof( FauxSelectConductor ) != 'undefined' &&
    typeof( Prototype ) != 'undefined' &&
    typeof( Fx ) != 'undefined' &&
    document.getElementById &&
    document.getElementsByTagName &&
    document.createElement &&
    document.getElementsByTagName( 'select' ) ){
  init.actions.push( function(){
    FauxSelectConductor.initialize( { maxHeight: 300 } );
  } );
}