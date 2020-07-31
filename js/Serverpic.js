 		
    var lElemento = 0;               //Si existe el elemento se pone a 1 en caso contrario a 0
    var url = 'http://picservertest.jusaba.es:2001/'
    var mySocket = AbreSocket(); //Abrimos Socket
    var nEstado = 0;
    var lFlag = 0;
 		/** 
		******************************************************
		* @brief Funcion que se ejecuta cuando hay un cambio de estado de un boton
        *
        * Cuando hay un cambio de estado se envia al dispositivo la orden contraria al estado actual del boton
		*
		* @param cDestinatario.- Dispositivo al que s le envia la orden
		*
		* Cuando se detecta cambio de estado de un boton, se llama a EnviadDato para enviar a serverpic la orden pertinente al dispositivo
        * Luego se comprueba que se ha ejecutado la orden tal como se describe en EnviaDato()
		*
		*/

		function CambioEstadoBoton(cDestinatario)
		{
			if ($("#Boton").jqxSwitchButton('checked'))
			{
				EnviaDato('On', cDestinatario);
			}else{
				EnviaDato('Off', cDestinatario);
			}	
		}	
 		/** 
		******************************************************
		* @brief Actualiza el estado del boton
		*
		* @param cEstado.- Estado que se desea para el boton ( On/Off )
		*
		*/


	 	function ActualizaBoton (cEstado)
		{
			if ( cEstado == 'Off')
			{	
				$('#Boton').jqxSwitchButton('check');
			}else{
				$('#Boton').jqxSwitchButton('uncheck'); 			
			}	
		}			

        /** 
        ******************************************************
        * @brief Funcion para enviar una orden a un dispositivo por Socket
        *
        * @param cOrden.- Orden a enviar
        * @param cDestinatario.- Dispositivo al que se le envia la orden
        *
        * Cuando se pulsa el boton On/Off, se produce un cambio de estado, cuando se creo el boton en GetElementos(), se le asigno al boton
        * la funcion CambioEstadoBoton() que gestiona el cambio. esa funcíon enviara la orfden On/Off al dispositivo con esta funcion, el servidor
        * Grabara On/Off en el ultimo valor del dispositivo y con GetElemento actualiza el estado del boton al estado real del dispoitivo
        * Resumiendo, cuando se pulsa el boton, manda un cambio de estado al dispositivo y pregunta al servidor el estado del dispositivo
        * para de alguna forma asegurarse de que el dispositivo ha recibido la orden correctamente
        *
        */
		function EnviaDato(cOrden, cDestinatario)
        {
  			mySocket.send("/receiver", {}, "mensaje-:-"+cDestinatario+"-:-"+cOrden+"\n");

			//sleep(1000);
			//GetElemento(cDestinatario);
		}

        /** 
        ******************************************************
        * @brief Funcionque se ejecuta para chequear el boton y cambiar su estado si procede
        *
        * Esta funcion se ejecuta cuando se interroga el estado de un dispositivo con GetElemento()
        * una vez que GetElemento() pregunta al servidor por e dispositivo, se extrae el ultimo valor
        * y se chequea el boton para ver si esta en el estado adecuado y si no es asi, se cambia
        *
        * @param cOrden.- Respuesta del ultimo valor del dispositivo obtenido en GetElemento()
         *
        */

		function CheckBoton (cOrden)
		{
			if ( cOrden == 'On' )
			{
				if ( $("#Boton").jqxSwitchButton('checked') == true)
				{
					$('#Boton').jqxSwitchButton('unCheck');
				}	
			}else{
				if ( $("#Boton").jqxSwitchButton('checked') == false)
				{
					$('#Boton').jqxSwitchButton('check');
				}	
			}
		}
		/** 
		******************************************************
        * @brief Funcion que carga los elementos de la pagina
		*
		*/
    	function GetElementos()
        {

                cDestinatario = new URLSearchParams(window.location.search).get("usuario");
      	        $.getJSON(url+"dispositivos/"+cDestinatario, function(result){
                    CreaGauge();
                    CreaSlider();
                    CreaMenu();                   
			        CreaBotonOnOff();
            	    $('#Boton').on('change', function(){CambioEstadoBoton(cDestinatario)});
                });

        };



        /** 
        ******************************************************
        * @brief Funcion que abre socket con serverpic
        *
        * Abre el socket con serverpic, cuando se establece el socket carga los elementos de la pagina ( relo, slider,... ), manda al dispositivo
        * el mensaje/comado 'GetInicioWeb' y abre la suscripcion 'estado' por la que se lee todo el trafico del dispositivo, el dsipositivo responde 
        * la cadena 'estado-:-medida-:-Umbral inferior-:-Umbral Superior', si en la suscripcion estado se recibe esa información, se refleja en la pantalla
        * y se abren las suscripciones de medida y valor en las que se recibe la medida y el estado On/Off del dispositivo 
        *
        * @return Devuelve el socket abierto
        *
        */

        function AbreSocket ()
        {
            mySocket = Stomp.over(new SockJS(url+'mensajes'));                                                                                  //Abrimos el socket
            mySocket.connect({}, function () {                                                                                                  //Cuando se establece la conexión

                cDestinatario = new URLSearchParams(window.location.search).get("usuario");                                                     //Obtenemos el dispositivo de la url
                GetElementos();                                                                                                                 //Cargamos los elementos de la pagina    
                mySocket.send("/receiver", {}, "mensaje-:-"+cDestinatario+"-:-"+"GetInicioWeb"+"\n");                                           //mandamos al doispositivo el comando GetInicioWeb

                //Para valor actualizamos el estado del boton del disositivo
                mySocket.subscribe('/websocket/estado/' + new URLSearchParams(window.location.search).get("usuario"), function (output) {       //Creamos la suscripcion 'estado'

                    if ((output.body).indexOf("web-:-Inicio")==0)                                                                               //Si se recibe respuesta al comando GetInicioWeb
                    {                                                                                                                           //Se reflejan en los elementos de la pantalla
                        var aUmbrales = (output.body).split("-:-");                                                                             //Descomponemos la respuesta
                        SetRangos(parseInt(aUmbrales[4]),parseInt(aUmbrales[5]));                                                               //Ponemos los umbrales en el reloj gaugue
                        var cTexto = aUmbrales[3]+' ºC';                                                                                        //Componemos el texto del centro del reloj
    
                        $('#gauge_contenedor').jqxGauge({ caption: { value: cTexto, position: 'bottom', offset: [0, 10], visible: true }});     //Ponemos el texto en el reloj
                        $('#gauge_contenedor').jqxGauge({ value: parseInt(aUmbrales[3]) });                                                     //Pasamos a la aguja del reloj la medida

                        ActualizaBoton(aUmbrales[2]);                                                                                           //Ponemos el boton On/Off al estado que le toca

                        mySocket.subscribe('/websocket/medida/' + new URLSearchParams(window.location.search).get("usuario"), function (output) { //Abrimos la suscripcion de medida
                            var nTemperatura = parseInt(output.body);                                                                           //Obtenemos el valor de la medida
                            var cTexto = output.body+'ºC';                                                                                      //Componemos el texto del centro del reloj   
                            $('#gauge_contenedor').jqxGauge({ caption: { value: cTexto, position: 'bottom', offset: [0, 10], visible: true }}); //Visualizamos el texto
                            $('#gauge_contenedor').jqxGauge({ value: nTemperatura });                                                           //Pasamos a la aguja del reloj la medida
                        });     

                        mySocket.subscribe('/websocket/valor/' + new URLSearchParams(window.location.search).get("usuario"), function (output) { //Abrimos la suscripcion de estado
                            ActualizaBoton(output.body);                                                                                        //Si se recibe un estado, se actualiza el boton    
                        });

                    }

                    if ((output.body).indexOf("InfoPush-:-")>0)                                                                                //Si se recibe respuesta al comando InfoPush
                    {


                         var aInfoPush = (output.body).split("-:-");                                                                             //Descomponemos la respuesta

                         $('#TextInput').val(aInfoPush[4]);
                         if ( aInfoPush[3] == '1')
                         {
                            $("#Habilitar").jqxCheckBox({ checked: true });
                         }else{

                            $("#Habilitar").jqxCheckBox({ checked: false });                            
                         }   

$('#jqxLoader').jqxLoader('close');
           $('#customWindow').show();
                    }
                });

            }, function (err) {
                alert('error' + err);
            });  
            return mySocket;
        }



        /** 
        ******************************************************
        * @brief Funcion que carga el json correspondiente al dispositivo, recupera el ultimo valor del dispositivo y
        * comprueba/modifica el esatdo del boton en funcion del ultimo valor
        * 
        */

		function GetElemento (cElemento)
		{
			$.getJSON(url+"dispositivos/"+cElemento, function(result){
	       		if ( result.ultimoValor !== null)
			     {	
			         CheckBoton(result.ultimoValor);
			     }else{
				    console.log ( "Null");					
    		      }	
			 });		
		}			






        /** 
        ******************************************************
        * @brief Funcion que se ejecuta cuando se pulsa el boton configurar
        *
        * Quita el boton configurar, oculta la barra de desplazamiento, visualiza el menu de configuracion
        * y envia los datos de configuracion al dispostitivo
        */

        function MandaConfiguracion ()
        {


            //Destruimos capa y boton de mandar configuracion
            $( "#Configurar" ).remove();
            $("#CfgBoton").remove();

            //Ocultamos el slider
            $('#slider').hide();

            //Visualizamos el boton
            $('#Boton').show();   

            //Visualizamos el boton de configuracion
            $('#Configuracion').show();

                    


            var aValores =  $('#slider').jqxSlider('values');
            var min = aValores[0];
            var max = aValores[1];
            alert (aValores[0]);
            mySocket.send("/receiver", {}, "mensaje-:-"+cDestinatario+"-:-"+"SetUmbrales-:-"+min.toString()+"-:-"+max.toString()+"\n");
        }

        /** 
        ******************************************************
        * @brief Crea los elementos de la pagina Reloj, barra desplazamiento y menu
        *
        */
        $(document).ready(function () {
            

        });


        /** 
        ******************************************************
        * @brief Funcion que crea el reloj gauge
        *
        * Primero se crean los marcadores 
        *   - Margen de ajuste, marcador inferior y marcador superior
        * Luego se diseñan los borden, color, marcas metricas y el margen del reloj ( min, max) y el valor que debe marcar inicialmente
        */    
        function CreaGauge ()
        {
            //Create jqxGauge

            $('#gauge_contenedor').jqxGauge({
                cap: { radius: 0.04 },
                caption: { offset: [0, 10], value: 'Temperatura', position: 'bottom' },
                value: 0,
                style: { stroke: '#ffffff', 'stroke-width': '1px', fill: '#ffffff' },
                border: { size: '11%', style: { stroke: '#898989'}, visible: true },
                labels: { distance: '50px', position: 'inside', interval: 20, offset: [0, -10], visible: true},
                animationDuration: 1500,
                colorScheme: 'scheme04',
                ticksMinor: { interval: 5, size: '5%', tyle: { stroke: '#002345'}, visible: true },
                ticksMajor: { interval: 10, size: '10%',  style: { stroke: '#002345'}, visible: true },
                min: -10,
                max: 55,
                value: 0
            });
        }    
        /** 
        ******************************************************
        * @brief Funcion que crea la barra de ajuste de los limites inferior y superior
        *
        * Diseñamos un slider en el que el margen debe corresponder con el margen de ajuste del reloj
        * Inicialmente estara oculto
        * Cuando se muevan los cursores, se moveran los cursores del reloj
        */    

        function CreaSlider ()
        {


            //Creamos el slider
            $('#slider').jqxSlider({ 
                width: 300, 
                height: 30,
                theme: 'energyblue',
                tooltip: false, 
                ticksPosition: 'top',
                mode: 'fixed',
                step: 1,
                rangeSlider: true, 
                min: -5,
                max: 25,
                showRange: true,
                layout: 'normal',
                showTickLabels: true, 
                showTicks: true,
                showButtons: true,
                ticksFrequency: 5,
                values: [0,5]
            });

            //Ocultamos el Slider
            $('#slider').hide();

            /** 
            ******************************************************
            * Funcion que se ejecuta cuando se mueve la barra de desplazamiento
            *
            */    
            $('#slider').on('slide', function (event) {
                //Determinamos los valores end y start marcados en la barra
                var nValorSuperior = new Number(event.args.value.rangeEnd).toFixed(0);
                var nValorInferior = new Number(event.args.value.rangeStart).toFixed(0);

                SetRangos (nValorInferior, nValorSuperior);    
                //Reflejamos en el texto del gauge los datos end y start
                $('#gauge_contenedor').jqxGauge({ caption: { value: + nValorInferior + " - " + nValorSuperior, position: 'bottom', offset: [0, 10], visible: true }});

                SetRangos(parseInt(nValorInferior),parseInt(nValorSuperior));

            });        
        }
        /** 
        ******************************************************
        * Establece en los rangos del reloj los umbrales
        *
        * @param nValorI.- Umbral inferior
        * @param nValorS.- Umbral superior
        *
        */    

        function SetRangos (nValorI,nValorF)
        {

                //Determinamos las puntos de inicio y final de las marcas del gauge teneindo en cuenta el grosor de la marca ( 5 )
                var valorInferior0 = nValorI - 5;
                var valorInferior1 = nValorI;
                var valorSuperior0 = nValorF;
                var valorSuperior1 = nValorF + 5;
                var ranges = [
                {
                    startValue: -5,
                    endValue: 25,
                    startWidth: 13,
                    endWidth: 13,
                    startDistance: '5%',
                    endDistance: '5%',
                    style: {
                        fill: '#bcbcbc',
                        stroke:  '#bcbcbc'
                    }
                },
                {
                    startValue: valorInferior0,
                    endValue: valorInferior1,
                    startWidth: 13,
                    endWidth: 13,
                    startDistance: '5%',
                    endDistance: '5%',
                    style: {
                        fill:'#3e21e0',
                        stroke: '#3e21e0'
                    }
                },
                {
                    startValue: valorSuperior0,
                    endValue: valorSuperior1 ,
                    startWidth: 13,
                    endWidth: 13,
                    startDistance: '5%',
                    endDistance: '5%',
                    style: {
                        fill: '#d02841',
                        stroke:  '#d02841'
                    }
                }];

                $('#gauge_contenedor').jqxGauge({ ranges: ranges });                

        }
        /******************************************************
        * @brief Funcion que crea el boton de encendido apagado
        *
        */    

        function CreaBotonOnOff ()
        {
            $('#Boton').jqxSwitchButton({ 
 				height: 27, 
 				width: 140,
            	offLabel:'On',
            	onLabel:'Off' 
            }); 
        }
        /******************************************************
        * @brief Funcion que crea el menu de opciones
        *
        */            
        function CreaMenu ()
        {
            $("#Menu").jqxMenu({theme: "dark", width: '150px',  mode: 'vertical'});
        }

        /******************************************************
        * @brief Oculta los elementos de la pagina principal
        */            

        function PantallaHide()
        {
           $('#gauge_contenedor').hide();
           $("#Menu").hide();
           $("#Boton").hide();
        } 
        /******************************************************
        * @brief Visualiza los elementos de la pagina principal
        */            

        function PantallaShow()
        {
           $('#gauge_contenedor').show();
           $("#Menu").show();
           $("#Boton").show();
        } 

        function CreaWindowUmbrales ()
        {


            PantallaHide();

           $('Main').append('<div id="customWindow"></div>');
           $( "#customWindow" ).append( '<div id="customWindowHeader"><span id="captureContainer" style="float: left">Configuracion Alarma</span></div>');
           $( "#customWindow" ).append( '<div id="customWindowContent" style="overflow: hidden"></div>');
           $( "#customWindowContent" ).append( '<div id="Contenido" style="overflow: hidden;  display: flex; align-items: center;"></div>');
           $( "#Contenido" ).append( '<div id="sliderWindow" style="overflow: hidden; float: left;"></div>');
           $( "#Contenido" ).append( '<div id="Botones" style="margin-bottom: 5px; float: right;"></div>');
           $( "#Botones" ).append( '<input type="button" value="Confirmar" style="margin-bottom: 5px; floa   align-items: center;t: left;" id="Confirmar" /><br />');
           $( "#Botones" ).append( '<input type="button" value="Cancelar" id="cancelButton" />');

           $('#customWindow').jqxWindow(
               { width: 400,
                 height: 100, 
                 resizable: false,
                 theme: 'orange',
                 initContent: function () {
                       $('#Confirmar').jqxButton({ width: '80px', disabled: false });
                       $('#cancelButton').jqxButton({ width: '80px', disabled: false });
                       $('#Confirmar').on('click', function(){
                           ConfigUmbrales ();
                       });

                       $('#cancelButton').on('click', function(){
                           CancelUmbrales ();
                       });            

                       $('#sliderWindow').jqxSlider({ 
                           width: 300, 
                           height: 30,
                           theme: 'orange',
                           tooltip: true, 
                           showMinorTicks: true,
                           ticksPosition: 'top',
                           mode: 'fixed',
                           step: 1,
                           rangeSlider: true, 
                           min: -5,
                           max: 25,
                                    showRange: true,
                           layout: 'normal',
                           showTickLabels: true, 
                           showTicks: true,
                           showButtons: true,
                           ticksFrequency: 5,
                           values: [0,5]
                       });

                       cranges = $('#gauge_contenedor').jqxGauge('ranges');                                          //Extraemos del reloj los umbrales
                       $('#sliderWindow').jqxSlider({ values: [cranges[1].endValue, cranges[2].startValue] });       //y los trasladamos al slider
                 }
            });
            $('#customWindow').on('close', function (event) {CloseUmbrales();}); 
        }   

        function CreaWindowPush ()
        {

            cDestinatario = new URLSearchParams(window.location.search).get("usuario");                             //Determnamos usuario
            mySocket.send("/receiver", {}, "mensaje-:-"+cDestinatario+"-:-"+"#clientepush"+"\n");                   //pedimos la informacion push del dispositivo
            PantallaHide();                                                                                         //Ocultamos los elementos de la pantalla principal


            $('#jqxLoader').jqxLoader({ isModal: true, width: 300, height: 80, imagePosition: 'center' });          //Creamos un gif de carga
            $("#jqxLoader").jqxLoader({text: "Cargando datos push de "+cDestinatario+"..." });
            $('#jqxLoader').jqxLoader('open');                                                                      //Lo activamos

           $('Main').append('<div id="customWindow"></div>');                                                       //Creamos la ventana Pushover
           $( "#customWindow" ).append( '<div id="customWindowHeader"><span id="captureContainer" style="float: left">Cliente PushOver</span></div>');
           $( "#customWindow" ).append( '<div id="customWindowContent" style="overflow: hidden"></div>');
           $( "#customWindowContent" ).append( '<div id="Contenido" style="overflow: hidden"></div>');
           $( "#Contenido" ).append( 'Usuario: '); 
           $( "#Contenido" ).append( '<input type="text" style="width: 125px; height:20px; border: 1px solid #aaa" id="TextInput" />');          
           $( "#Contenido" ).append( '<div id="Botones" style="float: right"></div>');
           $( "#Botones" ).append( '<input type="button" value="Confirmar" style="margin-bottom: 5px;" id="Confirmar" /><br />');
           $( "#Botones" ).append( '<input type="button" value="Probar" style="margin-bottom: 5px;" id="Prueba" /><br />');
           $( "#Botones" ).append( '<input type="button" value="Cancelar" id="cancelButton" />');
           $( "#Contenido" ).append( '<br />' );
           $( "#Contenido" ).append( '<br />' );           
           $( "#Contenido" ).append( '<div id="Habilitar">Habilitar</div>')
           
           $( "#customWindow" ).hide();                                                                              //Ocultamos la ventana pushover hasta que se reciben los dto
           
           $( "#customWindowContent" ).append( '<div id="Contenido" style="overflow: hidden"></div>');               //Añadimos los componentes de la ventana push                 
                    $('#customWindow').jqxWindow({  width: 300,
                    height: 140, resizable: false,
                    theme: 'orange',
                    initContent: function () {
                        $('#Confirmar').jqxButton({ width: '80px', disabled: false });
                        $('#Prueba').jqxButton({ width: '80px', disabled: true });                        
                        $('#cancelButton').jqxButton({ width: '80px', disabled: false });
                        $('#Habilitar').jqxCheckBox({ width: '150px' });

                        $('#Confirmar').on('click', function(){
                            ConfigPush ();
                        });

                        $('#cancelButton').on('click', function(){
                            CancelPush ();
                        });
                    }
            });
            $('#customWindow').on('close', function (event) {ClosePush();}); 
        }
        /******************************************************
        * @brief Funcion para configurar las marcas de las alarmas superior e inferior
        *
        */            
    
        function ConfigAlarma ()
        {    

            cranges = $('#gauge_contenedor').jqxGauge('ranges');                                   //Extraemos del reloj los umbrales
            $('#slider').jqxSlider({ values: [cranges[1].endValue, cranges[2].startValue] });       //y los trasladamos al slider
            //Ocultamos el boton de configuracion
            $('#Configuracion').hide();
            //Ocultamos la capa contenedora del boton on/off
            $('#Boton').hide();   
        
            //Visualizamos el slider
            $('#slider').show();
            //Creamos un boton de mandar la configuracion que cuando se pulse ejecuta la funcion MandaConfiguracion()
            $('Main').append('<div id="Configurar"></div>');
            $( "#Configurar" ).append( '<button id="CfgBoton" style="margin-top: 30px; margin-left: 10%;" id="button">Configurar</button>');
            $("#CfgBoton").on("click",function(){MandaConfiguracion()});

        }
        function ConfigUmbrales ()
        {
            cDestinatario = new URLSearchParams(window.location.search).get("usuario");                                                     //Obtenemos el dispositivo de la url
            var aValores =  $('#sliderWindow').jqxSlider('values');
            var min = aValores[0];
            var max = aValores[1];
            mySocket.send("/receiver", {}, "mensaje-:-"+cDestinatario+"-:-"+"SetUmbrales-:-"+min.toString()+"-:-"+max.toString()+"\n");
            $('#customWindow').jqxWindow('destroy');  
            SetRangos(min, max);  
            $('#gauge_contenedor').show();       
            $("#Menu").show();               

           
        }
        function ConfigPush ()
        {
            alert($("#TextInput").val());
            $('#customWindow').jqxWindow('destroy');    
            $('#gauge_contenedor').show();    
            $("#Menu").show();               
        }
        function CancelPush ()
        {
            $('#customWindow').jqxWindow('destroy');    
            PantallaShow();
 
        }
        function ClosePush ()
        {
            $('#customWindow').jqxWindow('destroy');    
            PantallaShow();

        }
        function CancelUmbrales ()
        {
            $('#customWindow').jqxWindow('destroy');    
            PantallaShow();
        }
        function CloseUmbrales ()
        {
            $('#customWindow').jqxWindow('destroy');
            PantallaShow();
        }

        /**
        ******************************************************
        * @brief temporiza los milisegundos pasados por parametro
        *
        * @param nMilisegundos.- Milisegundos a temporizae
        *
        */
        function sleep(nMilisegundos) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > nMilisegundos){
                    break;
                }
            }
        }

