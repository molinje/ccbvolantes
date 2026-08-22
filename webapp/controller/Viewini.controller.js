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

            // Modelo local del formulario (selección de Periodo / Año / Tipo Pago)
            var oToday = new Date();
            var sMesActual = String(oToday.getMonth() + 1).padStart(2, "0");

            var oViewiniModel = new JSONModel({
                periodo: sMesActual,
                anio: "",
                tipoPago: "NOMI"
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
         * Genera (abre/descarga) el volante de pago del empleado para el
         * Periodo / Año / Tipo de Pago seleccionados en el formulario.
         */
        onGenerarVolante() {
            var oGlobalDataModel = this.getOwnerComponent().getModel("globalData");
            var oViewiniModel = this.getView().getModel("viewiniView");

            var sPernr = oGlobalDataModel.getProperty("/userData/d/Pernr");
            var sAreaNom = oGlobalDataModel.getProperty("/userData/d/Area_Nom");

            var sPeriodo = oViewiniModel.getProperty("/periodo");
            var sAnio = oViewiniModel.getProperty("/anio");
            var sTipoPago = oViewiniModel.getProperty("/tipoPago");

            if (!sPernr || !sAreaNom) {
                MessageBox.error("No se han cargado los datos del empleado. Intente recargar la aplicación.");
                return;
            }

            if (!sPeriodo || !sAnio || !sTipoPago) {
                MessageBox.warning("Seleccione Periodo, Año y Tipo de Pago antes de generar el volante.");
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
