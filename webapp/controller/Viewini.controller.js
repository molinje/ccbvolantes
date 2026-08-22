sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "certificados/ccb/org/ccbcertvolantes/service/BackendService"
], (Controller, BackendService) => {
    "use strict";

    return Controller.extend("certificados.ccb.org.ccbcertvolantes.controller.Viewini", {

        onInit() {
            this._oBackendService = new BackendService();

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
        }
    });
});
