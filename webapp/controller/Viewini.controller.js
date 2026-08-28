sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "certificados/ccb/org/ccbcertvolantes/service/BackendService"
], (Controller, JSONModel, MessageBox, BackendService) => {
    "use strict";

    return Controller.extend("certificados.ccb.org.ccbcertvolantes.controller.Viewini", {

        onInit() {
            this._oBackendService = new BackendService();

            // Modelo local del formulario (selección de Periodo / Año / Tipo Pago).
            // Ninguno de los tres campos debe tener valor preseleccionado al cargar.
            var oViewiniModel = new JSONModel({
                periodo: "",
                anio: "",
                tipoPago: "",
                tiposPago: [],
                otroPernr: ""
            });
            this.getView().setModel(oViewiniModel, "viewiniView");

            // Datos del empleado logueado (correo) desde el modelo global
            var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
            var sEmail = oGlobalDataModel.getProperty("/userLogin/email");

            if (!sEmail) {
                console.warn("No se encontró el correo del usuario logueado en globalData>/userLogin/email");
                return;
            }

            this._oBackendService.GetDataEmployee(sEmail)
                .then(function (oResponse) {
                    console.log("Datos básicos / certificado laboral del empleado:", oResponse);
                    oGlobalDataModel.setProperty("/userData", oResponse);
                })
                .catch(function (oError) {
                    console.error("Error al consultar DatosBasicosCertLabSet:", oError);
                });
        },

        /**
         * Maneja el evento "change" de los Select de Periodo y Año. Cuando ambos
         * tienen valor, calcula el listado de opciones del Select de Tipo Pago
         * (NominaEspecialSet); mientras falte alguno, deja ese listado vacío y
         * limpia la selección de Tipo Pago.
         */
        onPeriodoAnioChange() {
            var oViewiniModel = this.getView().getModel("viewiniView");

            var sPeriodo = oViewiniModel.getProperty("/periodo");
            var sAnio = oViewiniModel.getProperty("/anio");

            // Cada vez que cambia Periodo o Año, la lista/selección previa de
            // Tipo Pago queda obsoleta: se limpia siempre antes de recalcular.
            oViewiniModel.setProperty("/tipoPago", "");
            oViewiniModel.setProperty("/tiposPago", []);

            var oSelTipoPago = this.byId("selTipoPago");
            if (oSelTipoPago) {
                oSelTipoPago.setValueState("None");
            }

            if (!sPeriodo || !sAnio) {
                return;
            }

            var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
            var sPernr = oGlobalDataModel.getProperty("/userData/d/Pernr");

            if (!sPernr) {
                console.warn("No se encontró el número de empleado en globalData>/userData/d/Pernr");
                return;
            }

            this._oBackendService.getTiposPago({
                Pernr: sPernr,
                Anio: sAnio,
                Periodo: sPeriodo
            })
                .then(function (aTiposPago) {
                    oViewiniModel.setProperty("/tiposPago", aTiposPago);
                })
                .catch(function (oError) {
                    console.error("Error al consultar los tipos de pago (NominaEspecialSet):", oError);
                    MessageBox.error("No fue posible consultar los tipos de pago disponibles para el Periodo y Año seleccionados.");
                });
        },

        /**
         * Maneja el evento "liveChange" del campo "Otro Numero de personal":
         * solo permite dígitos y limita la longitud a 8 posiciones.
         */
        onOtroPernrLiveChange(oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oEvent.getParameter("value") || "";
            var sSanitized = sValue.replace(/[^0-9]/g, "").slice(0, 8);

            if (sSanitized !== sValue) {
                oInput.setValue(sSanitized);
            }

            this.getView().getModel("viewiniView").setProperty("/otroPernr", sSanitized);
        },

        /**
         * Genera (abre/descarga) el volante de pago del empleado para el
         * Periodo / Año / Tipo de Pago seleccionados en el formulario.
         */
        onGenerarVolante() {
            var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
            var oViewiniModel = this.getView().getModel("viewiniView");

            var sAreaNom = oGlobalDataModel.getProperty("/userData/d/Area_Nom");

            // Determina el número de personal a utilizar: si el usuario tiene
            // permiso (globalData>/userData/d/TienePermiso = true) y diligenció
            // un valor numérico > 0 en "Otro Numero de personal", se usa ese valor;
            // de lo contrario se usa el Pernr del empleado logueado.
            var bTienePermiso = oGlobalDataModel.getProperty("/userData/d/TienePermiso") === true;
            var sOtroPernr = oViewiniModel.getProperty("/otroPernr");
            var nOtroPernr = parseInt(sOtroPernr, 10);

            var sPernr;
            if (bTienePermiso && sOtroPernr && nOtroPernr > 0) {
                sPernr = sOtroPernr;
            } else {
                sPernr = oGlobalDataModel.getProperty("/userData/d/Pernr");
            }

            if (!sPernr || !sAreaNom) {
                MessageBox.error("No se han cargado los datos del empleado. Intente recargar la aplicación.");
                return;
            }

            var sPeriodo = oViewiniModel.getProperty("/periodo");
            var sAnio = oViewiniModel.getProperty("/anio");
            var sTipoPago = oViewiniModel.getProperty("/tipoPago");

            var oSelPeriodo = this.byId("selPeriodo");
            var oSelAnio = this.byId("selAnio");
            var oSelTipoPago = this.byId("selTipoPago");

            var aMissing = [];

            if (!sPeriodo) {
                aMissing.push("Periodo");
                oSelPeriodo.setValueState("Error");
                oSelPeriodo.setValueStateText("Seleccione un Periodo.");
            } else {
                oSelPeriodo.setValueState("None");
            }

            if (!sAnio) {
                aMissing.push("Año");
                oSelAnio.setValueState("Error");
                oSelAnio.setValueStateText("Seleccione un Año.");
            } else {
                oSelAnio.setValueState("None");
            }

            if (!sTipoPago) {
                aMissing.push("Tipo Pago");
                oSelTipoPago.setValueState("Error");
                oSelTipoPago.setValueStateText("Seleccione un Tipo de Pago.");
            } else {
                oSelTipoPago.setValueState("None");
            }

            if (aMissing.length > 0) {
                MessageBox.warning("Debe seleccionar un valor para: " + aMissing.join(", ") + ".");
                return;
            }

            var sUrl = this._oBackendService.getVolanteUrl({
                Pernr: sPernr,
                Periodo: sPeriodo,
                Anio: sAnio,
                PayOcsrn: sTipoPago,
                Area_Nom: sAreaNom
            });

            window.open(sUrl, "_blank");
        }
    });
});
