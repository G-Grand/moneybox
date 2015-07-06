var FrameHeightManager =
{
    FrameId: '',
    getCurrentHeight : function()
    {
          myHeight = 0;
          
          if( typeof( window.innerWidth ) == 'number' ) {
            myHeight = window.innerHeight;
          } else if( document.documentElement && document.documentElement.clientHeight ) {
            myHeight = document.documentElement.clientHeight;
          } else if( document.body && document.body.clientHeight ) {
            myHeight = document.body.clientHeight;
          }
          
          return myHeight;      
    },    
    publishHeight : function()
    {
        if (this.FrameId == '') return;
        // если нет jQuery - воспользуемся решениями для  определения размеров из яндекса
        if(typeof jQuery === "undefined") {
            var actualHeight ="";
            var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
            if(isFirefox) actualHeight = (document.body.scrollHeight > document.body.offsetHeight)?document.body.scrollHeight:document.body.offsetHeight;
            else actualHeight = (document.documentElement.scrollHeight > document.body.offsetHeight)?document.documentElement.scrollHeight:document.body.offsetHeight;
            var currentHeight = this.getCurrentHeight();            
        } else {
            var actualHeight = $("body").height();
            var currentHeight = $(window).height();            
        }

        if(Math.abs(actualHeight - currentHeight) > 20)
        {
            pm({
              target: window.parent,
              type: this.FrameId, 
              data: {height:(actualHeight+50), id:this.FrameId}
            });
        }       
    }   

};

pm.bind("register", function(data) {
    FrameHeightManager.FrameId = data.id;
    // не забываем передать правильный this
    window.setInterval(function() {FrameHeightManager.publishHeight.call(FrameHeightManager)}, 300);
});