/*------------------------------------------------------------------------------
Function:       FauxSelect()
Author:         Aaron Gustafson (aaron at easy-designs dot net)
Creation Date:  12 September 2006
Version:        0.2
Homepage:       http://code.google.com/p/easy-designs/wiki/FauxSelect
License:        MIT License (see homepage)
Note:           If you change or improve on this script, please let us know by
                emailing the author (above) with a link to your demo page.
------------------------------------------------------------------------------*/
// -- COLLECT & ENABLE THE FAUX-SELECTS -- //
var FauxSelectConductor = {
  // A list of all the faux-SELECTs
  list:       [],
  // The faux-select specific CSS styles
  cssFile:    'FauxSelect.css',
  // The layer for the faux-SELECT
  zindex:      10000,
  // The maximum size of the dropdown
  maxHeight:   300,
  // BODY height
  bodyHeight:  0,
  // "model" elements
  elements:   { li:  document.createElement( 'li' ),
                div: document.createElement( 'div' ),
                p:   document.createElement( 'p' ),
                ul:  document.createElement( 'ul' ) },
  initialize: function( params ){
    trace( 'FauxSelectConductor.initialize() ran' );

    // collect the params
    params = params || {};
    if( typeof( params.maxHeight ) != 'undefined' ) this.maxHeight = params.maxHeight;
    // set the BODY height
    this.bodyHeight = $( document.getElementsByTagName( 'body' )[0] ).getHeight() + 'px';

    // find the path to this script
    var path = false, filename = 'FauxSelect.js';
    var scripts = document.getElementsByTagName( 'script' );
    for( var i=0; i<scripts.length; i++ ){
      if( scripts[i].getAttribute( 'src' ).indexOf( filename ) != -1 ){
        path = scripts[i].getAttribute( 'src' ).replace( new RegExp( filename ), '' );
        break;
      }
    }
    // attach the standard CSS file
    var css = document.createElement('link');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', path + this.cssFile);
    document.getElementsByTagName( 'head' )[0].appendChild( css );

    // collect the SELECTs
    var selects = $A( document.getElementsByTagName( 'select' ) );
    trace( 'found '+selects.length+' SELECTs' );
    // loop through the collection
    selects.each( function( item, i ){
      // get the id
      var id = item.getAttribute( 'id' );
      // give the SELECT an ID if it doesn't have one
      if( id === false ){
        id = 'auto-ided-select-' + i;
        item.setAttribute( 'id', id );
      }
      // let us know when one is found
      trace( 'instantiating faux-select: "'+id+'"' );
      // make it into a FauxSelect
      this.list[id] = new FauxSelect( id );
    }.bind( this ) );
    trace( 'FauxSelectConductor.initialize() finished' );
  }
};

var FauxSelect = Class.create();
FauxSelect.prototype = {
  // the ID of the SELECT
  id:         false,
  // the original SELECT element
  select:     false,
  // the DIV containing the faux-SELECT
  container:  false,
  // the faux-SELECT UL
  faux:       false,
  // the faux-SELECT P (seen as the selected value)
  value:      false,
  // The closer DIV for this faux-SELECT
  closer:     false,
  // used to track faux-OPTION position (for keyboard use)
  last:       false,
  // type of SELECT (standard, multiple, or optgrouped)
  type:       'standard',
  // keep the faux-SELECT from closing? fixes a blur bug
  preventClose: false,
  initialize: function( id ){
    // let us know FauxSelect initialized
    trace( 'FauxSelect.initialize() ran and received the ID "'+id+'"' );

    // store the ID
    this.id = id;

    // store the SELECT node
    this.select = $( id );

    // -- BUILD THE FAUX-SELECT -- //
    // create the faux-SELECT UL
    this.faux = $( FauxSelectConductor.elements.ul.cloneNode( true ) );
    this.faux.setAttribute( 'id', 'replaces_'+id );
    this.faux.addClassName('faux-select');
    trace( 'built the faux' );

    /* set the width, based on the existing SELECT
       (subtracting any border or padding) */
    this.faux.style.width = (
      parseInt( this.select.getWidth() )
      // Subtract borders
      - parseInt( this.select.getStyle( 'border-left-width' ) )
      - parseInt( this.select.getStyle( 'border-right-width' ) )
      // Subtract padding
      - parseInt( this.select.getStyle( 'padding-left' ) )
      - parseInt( this.select.getStyle( 'padding-right' ) )
    ) + 'px';

    // collect the children & make them enumerable
    var children = $A( this.select.childNodes );
    children.each( function( item, i ){
      if( item.nodeName.toUpperCase() == 'OPTION' ||
          item.nodeName.toUpperCase() == 'OPTGROUP' ){
        // build the faux-OPTION or faux-OPTGROUP
        var el = this.makeFake( item );
        // append it to the faux-SELECT
        this.faux.appendChild( el );
      }
    }.bind( this ) );

    /* append the faux-SELECT to the SELECT's parent, but keep it
       invisible because we don't want it to appear quite yet.
       We do need to append it though because we can't get it's
       height (which we'll need in a moment) without doing so */
    this.faux.style.visibility = 'hidden';
    this.select.parentNode.appendChild( this.faux );
    trace( 'appended the faux-SELECT' );

    // is this a multiple SELECT?
    if( this.select.getAttribute( 'multiple' ) ){
      trace( 'it\'s  a multiple' );
      /* special stuff happens when it's a multiple SELECT, we should
         CLASSify the faux-SELECT */
      this.faux.addClassName( 'multiple' );
      // set the FauxSelect object as a multiple
      this.type = 'multiple';
      /* set the height inline, making it the height of an OPTION
         in the original x the value of the SELECT's SIZE attribute */
      this.faux.style.height = (
        parseInt( this.select.getHeight() )
        // Subtract borders
        - parseInt( this.select.getStyle( 'border-top-width' ) )
        - parseInt( this.select.getStyle( 'border-bottom-width' ) )
        // Subtract padding
        - parseInt( this.select.getStyle( 'padding-top' ) )
        - parseInt( this.select.getStyle( 'padding-bottom' ) )
      ) + 'px'
      // slide it up the height of the SELECT we're replacing
      this.faux.style.marginTop = '-' + ( parseInt( this.faux.style.height ) ) + 'px';
      /* Safari doesn't show scrollbars if the height is
         less than 65px, so we need to force it */
      if( parseInt( this.faux.style.height ) < 65 ) this.faux.style.height = '65px';
    } else {
      //--- Create a container DIV
      this.container = $( FauxSelectConductor.elements.div.cloneNode( true ) );
      this.container.addClassName( 'faux-container' );
      // transfer the ID
      this.container.setAttribute( 'id', 'replaces_'+id );
      this.faux.removeAttribute( 'id' );
      // slide it up the height of the SELECT we're replacing
      this.container.style.marginTop = '-'+ this.select.getHeight() +'px';

      //--- create the value P
      this.value = $( FauxSelectConductor.elements.p.cloneNode( true ) );
      this.value.setAttribute( 'id', 'value_'+id );
      this.value.addClassName( 'faux-value' );
      // set the default selected to be the value
      this.value.appendChild( document.createTextNode(
        this.select.getElementsByTagName(
          'option'
        )[this.select.selectedIndex].firstChild.nodeValue
      ) );
      /* this will be the trigger to open the faux-SELECT,
         so we'll need an event handler */
      Event.observe( this.value, 'click',
                     this.clickValue.bind( this ), false );
      this.container.appendChild( this.value );

      // add the "closed" CLASS to the faux-SELECT
      this.faux.addClassName( 'closed' );
      // set up the height FX for the faux-SELECT so it can open
      this.faux.heightFX = new fx.Style(
        this.faux, 'height',
        { duration: 350,
          onComplete: this.flip.bind( this ) }
      );

      // get the original height of the UL for when it's open
      this.faux.openHeight = this.faux.getHeight();
      trace( 'the original height of the UL is ' + this.faux.openHeight );
      // baseline OPTGROUP height (0)
      if( this.type == 'optgrouped' ){
        var OGheight = 0;
        var fOpts = $A( this.faux.getElementsByTagName( 'li' ) );
        fOpts.each( function( item ){
          if( Element.hasClassName( item, 'optgroup' ) ){
            // add the faux-OPTGROUP's UL's height
            OGheight += $( item.getElementsByTagName( 'ul' )[0] ).getHeight();
          }
        } );
        trace( 'the OPTGROUP\'s collective height is '+ OGheight );
        this.faux.openHeight = this.faux.openHeight - OGheight;
      }
      /* if this faux-SELECT has a lot of OPTIONs, it could
         end up being overly tall, we need to trim it down
         to a reasonable height, based on whatever we set in
         the FauxSelectConductor */
      if( this.faux.openHeight > FauxSelectConductor.maxHeight ){
        // mark this as an overflowing faux-SELECT
        this.type = ( this.type == 'optgrouped' ) ? 'overflowing-optgrouped' : 'overflowing';
        // reset the height
        this.faux.openHeight = FauxSelectConductor.maxHeight;
      }
      this.faux.closedHeight = 0;
      // close the faux-SELECT
      this.faux.heightFX.custom( this.faux.openHeight, this.faux.closedHeight );

      // remove the faux-SELECT and re-append to our container
      this.faux.parentNode.removeChild( this.faux );
      this.container.appendChild( this.faux );
      this.select.parentNode.appendChild( this.container );

      // -- BUILD THE CLOSER -- //
      this.closer = $( FauxSelectConductor.elements.div.cloneNode( true ) );
      this.closer.addClassName( 'closer' );
      this.closer.style.height = FauxSelectConductor.bodyHeight;
      /* we will use this hidden div (which we will set to track
         the cursor) to close the faux-SELECT when you click outside of it */
      Event.observe( this.closer, 'click', this.close.bind( this ), false );

    }
    // show the ul
    this.faux.style.visibility = '';

    // -- HANDLE EVENTS ON THE REAL SELECT -- //
    // focus
    Event.observe( this.select, 'focus', this.focus.bind( this ), false );
    // blur
    Event.observe( this.select, 'blur', this.blur.bind( this ), false );
    // typing
    this.select.onkeyup = this.updateFaux.bindAsEventListener( this );
    // clicking (for Safari)
    this.select.onclick = this.updateFaux.bindAsEventListener( this );

    /* Bind a mousedown event to the faux-select to indicate when
       we click the menu. The blur event in some browsers will trigger
       when we try to scroll so we need to prevent the menu from closing. */
    Event.observe( this.faux, 'mousedown', this.clickUL.bind(this), false );

    // -- HIDE THE REAL SELECT -- //
    this.select.addClassName( 'replaced' );
  },

  // --- DOM Building Methods
  makeFake:   function( node ){
    trace( 'contructing a faux-'+node.nodeName.toUpperCase() );
    // clone the model LI
    var el = $( FauxSelectConductor.elements.li.cloneNode( true ) );
    if( node.nodeName.toUpperCase() == 'OPTION' ){
      // store the faux-OPTION's value
      el.val = node.getAttribute( 'value' );
      // set the faux-OPTION's text value
      el.appendChild( document.createTextNode( node.firstChild.nodeValue ) );
      // check for selected
      // TODO: this needs some massaging
      if( this.select.value.indexOf( el.val ) != -1 ) el.addClassName( 'selected' );
      // set the event handlers
      Event.observe( el, 'click', this.clickLI.bind( this ), false ); // click
      Event.observe( el, 'mouseover', this.mouseoverLI, false ); // mouseover
      Event.observe( el, 'mouseout',  this.mouseoutLI,  false ); // mouseout
    }else if( node.nodeName.toUpperCase() == 'OPTGROUP' ){
      // note that this is an OPTGROUP-organized SELECT
      this.type = 'optgrouped';
      // set the faux-OPTION's text value
      el.appendChild( document.createTextNode( node.getAttribute( 'label' ) ) );
      // set the class on the LI
      el.addClassName( 'optgroup' );
      // build the container UL
      var ul = $( FauxSelectConductor.elements.ul.cloneNode( true ) );
      // set the left-position
      ul.style.left = this.faux.style.width;
      // collect the children & make them enumerable
      var children = $A( node.childNodes );
      children.each( function( child ){
        if( child.nodeName.toUpperCase() == 'OPTION' ||
            child.nodeName.toUpperCase() == 'OPTGROUP' ){
          var element = this.makeFake( child );
          ul.appendChild( element );
        }
      }.bind( this ) );
      el.appendChild( ul );
      /* if this is IE6 or below, we need a mouseover event
         to trigger the optgroup to open */
      el.onmouseover = this.openOptgroup.bindAsEventListener( this );  // mouseover
    }
    return el;
  },

  // --- faux-SELECT Actions
  open:        function(){
    trace('open() UL#replaces_' + this.id);

    // Indicate the state of the faux-select by removing the
    //   closed class and adding opening
    this.faux.removeClassName( 'closed' );
    this.faux.addClassName( 'opening' );

    // Stop the effect if we're half way through.
    this.faux.heightFX.stop();

    // if this is an overflow scroll to the selected LI
    var heightLI = this.faux.firstChild.getHeight(); // get a sample height
    var top = heightLI * this.select.selectedIndex;
    if( this.type.indexOf( 'overflowing' ) != -1 &&
        ( this.faux.scrollTop > top ||
          this.faux.scrollTop + FauxSelectConductor.maxHeight < top + heightLI ) )
      this.faux.scrollTop = top;
    // Open the fauxSelect by invoking the effect
    this.faux.heightFX.custom(
      this.faux.getHeight(),
      this.faux.openHeight
    );

    // Set the z-index of the faux-SELECT container
    this.container.style.zIndex = FauxSelectConductor.zindex;
    // Set the z-index of the closer to one less than the faux-SELECT container
    this.closer.style.zIndex = FauxSelectConductor.zindex - 1;
    // Append the closer to the document
    document.getElementsByTagName( 'body' )[0].appendChild( this.closer );

    // Trigger the focus event on the select
    this.select.focus();
  },
  close:       function(){
    trace('close() UL#replaces_' + this.id);

    // Check if the menu is open and if it isn't return
    if( !this.faux.hasClassName( this.type + '-open' ) ) return;

    // Indicate the state of the faux-select by removing the
    // open class and adding closing
    this.faux.removeClassName( this.type + '-open' );
    this.faux.addClassName( 'closing' );

    // Stop the effect if we're half way through.
    this.faux.heightFX.stop();

    // Close the faux-SELECT with an effect
    this.faux.heightFX.custom(
        this.faux.getHeight(),
        this.faux.closedHeight
    );
    // Remove the closer
    this.closer.parentNode.removeChild( this.closer );

    // reset the z-indexes
    this.container.style.zIndex = this.closer.style.zIndex = false;


  },
  flip: function(){
    trace( 'flipping ' + this.id );
    // If it's opening close it otherwise open it
    if( this.faux.hasClassName( 'opening' ) ){
      // Mark it open
      this.faux.removeClassName( 'opening' );
      this.faux.addClassName( this.type + '-open' );

      // If this is an overflow, scroll to the selected LI
      var heightLI = $( this.faux.firstChild ).getHeight();
      var top = heightLI * this.select.selectedIndex;
      if( this.type == 'overflowing' && (
          this.faux.scrollTop > top || this.faux.scrollTop
          + FauxSelectConductor.maxHeight < top + heightLI ) ) {
        this.faux.scrollTop = top;
      }
    } else {
      // Mark it closed
      this.faux.removeClassName(  'closing' );
      this.faux.addClassName( 'closed' );

      // Ensure all the li elements have their
      // hover class removed. It can stick around
      // because we manually closed the faux-select
      $A( this.faux.childNodes ).each( function( child ){
        if( child.hasClassName( 'hover' ) ) child.removeClassName( 'hover' );
      } );
    }
  },
  openOptgroup:   function( e ){
    var el = Event.element( e );
    // close all faux-OPTGROUPs
    var siblings = el.parentNode.childNodes;
    this.closeOptgroups( siblings );
    // open this one
    el.addClassName( 'optHover' );
    // remove it's mouseover event
    el.onmouseover = null;
  },
  closeOptgroups: function( nodes ){
    trace( 'this.closeOptgroups() ran' );
    $A( nodes ).each( function( item ){
      // check for the optHover CLASS & remove it
      if( item.hasClassName( 'optHover' ) ) item.removeClassName( 'optHover' );
      item.onmouseover = this.openOptgroup.bindAsEventListener( this );  // mouseover
    }.bind( this ) );
  },

  // --- Faux-SELECT Events
  clickValue: function(){
    // Open/close the faux-select
    if( this.faux.hasClassName( this.type + '-open' ) ){
      // The faux-SELECT is open
      this.close();
    } else {
      // The faux-SELECT is closed
      this.open();
    }
  },
  clickUL: function() {
    trace('clickUL()');
    // Prevent closing after a click in the scroll bar.
    this.preventClose = true;
  },
  clickLI:     function( e ){
    var el = Event.element( e );
    trace( 'clicked a LI in UL#replaces_'+this.id );
    // is it a multiple SELECT?
    if( this.type == 'multiple' ){
      // find the current position
      var current;
      var children = $A( this.faux.getElementsByTagName( 'li' ) );
      children.each( function( item, i ){
        // select the current li
        if( item == el ) current = i;
      } );
      trace( 'current position:'+current );
      if( e.ctrlKey || e.metaKey ){
        /* a multiple SELECT has 3 basic behaviors,
           the default is the same as a normal SELECT,
           but if the CTRL key is held down, it changes */
        trace( 'CTRL modifier used' );
        if( !el.hasClassName( 'selected' ) ){
          // element was not previously selected - select it
          this.selectLI( el );
        } else {
          // element was previously selected - deselect it
          this.deselectLI( el );
        }
      }else if( e.shiftKey ){
        /* if the SHIFT key is held down, select everything
           from the previously selected element to the newly
           selected one */
        trace( 'SHIFT modifier used' );
        /* TODO: add logic for the SELECT to function with SHIFT
           Check fsObj.last value and find the new one
           (up or down) and then select all in between */
        if( this.last < current ){
          var start = this.last;
          var end = current;
        } else {
          var start = current;
          var end = this.last;
        }
        trace( 'starting to loop at ' + start + ' and ending at ' + end );
        for( var i=start; i<=end; i++ ){
          trace( 'checking li #'+i );
          if( !children[i].hasClassName( 'selected' ) ){
            // element was not previously selected - select it
            this.selectLI( children[i] );
          }
        }
      } else {
        // normal SELECT behavior
        this.deselectAll();
        this.selectLI( el );
      }
      // set the lastClick to this element
      this.last = current;
      this.select.focus();
    } else {
      // normal SELECT behavior
      var fOpts = $$( '#replaces_' + this.id + ' li' );
      // collect everything but faux-OPTGROUPs
      if( this.type.indexOf( 'optgrouped' ) != -1 ){
        fOpts = $A( fOpts ).findAll( function( item ){
          return item.className != 'optgroup';
        } );
      }
      this.deselectLI( fOpts[this.select.selectedIndex] );
      this.selectLI( el );
      if( this.type.indexOf( 'optgrouped' ) != -1 )
        this.closeOptgroups( el.parentNode.childNodes );
      this.close();
    }
  },
  mouseoverLI: function( e ){
    Event.element(e).addClassName( 'hover' );
  },
  mouseoutLI:  function( e ){
    Event.element(e).removeClassName( 'hover' );
  },

  // --- Faux-SELECT Housekeeping
  selectLI:    function( el, cancelLoop ){
    trace( 'selectLI() ran' );
    // "select" the faux-OPTION
    $( el ).addClassName( 'selected' );
    trace( 'setting new value to '+ el.val );
    if( this.type == 'multiple' &&
        cancelLoop !== true ){
      trace( 'looping' );
      // collect the children of the faux-SELECT
      var children = $A( this.select.getElementsByTagName( 'option' ) );
      // iterate through them
      children.each( function( item, i ){
        // select the matching OPTION
        if( item.getAttribute( 'value' ) == el.val ) item.selected = true;
      } );
    }
    if( this.type != 'multiple' ){
      // set the faux-SELECT's "value"
      this.select.value = el.val;
      // set the faux-SELECT's "value"
      this.value.firstChild.nodeValue = el.firstChild.nodeValue;
    }
  },
  deselectLI:  function( el, cancelLoop ){
    trace( 'deselectLI() ran' );
    el.removeClassName( 'selected' );
    if( this.type == 'multiple' &&
        cancelLoop !== true ){
      trace( 'looping' );
      // love those multiples
      // collect the children of the faux-SELECT
      var children = $A( this.select.getElementsByTagName( 'option' ) );
      // iterate through them
      children.each( function( item ){
        // select the matching OPTION
        if( item.getAttribute( 'value' ) == el.val ) item.selected = false;
      } );
    }
  },
  deselectAll: function( what ){
    trace( 'deselecting all' );
    if( what == 'real' ||
        typeof( what ) == 'undefined' ){
      // collect the children of the faux-SELECT
      var children = $A( this.select.getElementsByTagName( 'option' ) );
      // iterate through them
      children.each( function( item ){
        // deselect the OPTION
        item.selected = false;
      } );
    }
    if( what == 'faux' ||
        typeof( what ) == 'undefined' ){
      // collect the children of the faux-SELECT
      children = $A( this.faux.getElementsByTagName( 'li' ) );
      // iterate through them
      children.each( function( item ){
        // if the className exists, remove it
        if( !item.hasClassName( 'optgroup' ) ) this.deselectLI( item );
      }.bind( this ) );
    }
  },

  // --- Real SELECT Events
  focus:      function(){
    trace( 'focusing' );
    if( this.type == 'multiple' ){
      this.faux.addClassName( 'focused' );
    } else {
      this.value.addClassName( 'focused' );
    }
  },
  blur:       function(){
    trace( 'blurring' );
    if( this.type == 'multiple' ){
      this.faux.removeClassName( 'focused' );
    } else {
      this.value.removeClassName( 'focused' );
    }
    if( this.faux.hasClassName( this.type + '-open' ) &&
        !this.preventClose ) this.close();
    /* If preventClose was true, the call to blur wasn't the
       one we wanted. The next one will be so set preventClose
       back to false */
    this.preventClose = false;
  },
  updateFaux: function( e ){
    trace( 'keypress' );
    var el = Event.element( e );
    var fOpts = $$( '#replaces_' + this.id + ' li' );
    // remove any optgroups
    if( this.type.indexOf( 'optgrouped' ) != -1 ){
      fOpts = $A( fOpts ).findAll( function( item ){
        return item.className != 'optgroup';
      } );
    }
    if( this.type == 'multiple' ){
      var rOpts = $A( el.getElementsByTagName( 'option' ) );
      /* A multiple SELECT works in different ways in different browsers,
         so rather than tie into keycodes (with the exception of CTRL),
         we will just track the values each time and update the faux-SELECT
         accordingly. It may seem like overkill, but it is the best solution. */
      var selected = [];
      for( i=rOpts.length-1; i>=0; i-- ){
        if( rOpts[i].selected ){
          selected.push( rOpts[i].getAttribute( 'value' ) );
        }
      }
      trace( 'selected: '+selected.toString() );
      var posn = 0;
      fOpts.each( function( li, i ){
        if( selected.indexOf( li.val ) != -1 ){
          trace( 'selecting ' + li.val );
          this.selectLI( li, true );
          posn = i;
        } else {
          trace( 'deselecting ' + li.val );
          this.deselectLI( li, true );
        }
      }.bind( this ) );
    } else {
      trace( 'this is not a multiple' );
      /* special case for ALT+Up & ALT+Down allows opening of
         the faux-SELECT without updating the value with each
         keypress. To confirm a value change, ENTER must be
         pressed (see next conditional) */
      if( e.altKey &&
          ( e.keyCode == '38' ||
            e.keyCode == '40' ) ){
        this.clickValue();
        return;
      }
      /* special case for ENTER and ESC to close the faux-select */
      if( this.faux.hasClassName( this.type + '-open' ) &&
          ( e.keyCode == '13' ||
            e.keyCode == '27' ) ){
        this.close();
      }
      if( this.faux.hasClassName( this.type + '-open' ) ){
        var fOpt = false;
        // back
        if( e.keyCode == '37' ||
            e.keyCode == '38' ){
          if( this.select.selectedIndex > 0 )
            fOpt = fOpts[this.select.selectedIndex - 1];
        }
        // forward
        if( e.keyCode == '39' ||
            e.keyCode == '40' ){
          if( this.select.selectedIndex < fOpts.length )
            fOpt = fOpts[this.select.selectedIndex + 1];
        }
        // top
        if( e.keyCode == '33' ||
            e.keyCode == '36' ){
          fOpt = fOpts[0];
        }
        // bottom
        if( e.keyCode == '34' ||
            e.keyCode == '35' ){
          fOpt = fOpts[fOpts.length-1];
        }
        if( fOpt ){
          this.deselectLI( fOpts[this.select.selectedIndex] );
          this.selectLI( fOpt );
        }
      } else {
        this.deselectAll( 'faux' );
        this.selectLI( fOpts[el.selectedIndex] );
      }
    }
    // adjust the scroll if there is one
    if( this.type == 'multiple' ||
        ( this.faux.className.indexOf( 'overflowing' ) != -1 &&
          this.faux.hasClassName( this.type + '-open' ) ) ){
      trace( 'this faux-SELECT overflows' );
      var ulHeight = this.faux.getHeight();
      var liHeight = $( this.faux.firstChild ).getHeight();
      if( // going down
          ( ( el.selectedIndex+1 ) * liHeight >
            this.faux.scrollTop + ulHeight ) ||
          // going up
          ( ( el.selectedIndex * liHeight ) < this.faux.scrollTop ) ){
        this.faux.scrollTop = el.selectedIndex * liHeight;
      }
      // special case for going down
      if( this.type == 'multiple' &&
          ( e.keyCode == '39' ||
            e.keyCode == '40' ) ){
        if( ( posn + 1 ) * liHeight > this.faux.scrollTop + ulHeight )
          this.faux.scrollTop = ( posn + 1 ) * liHeight;
      }
    }
  }
};