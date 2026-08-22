sap.ui.define([
    "sap/ui/core/UIComponent",
    "certificados/ccb/org/ccbcertvolantes/model/models",
    "certificados/ccb/org/ccbcertvolantes/service/BackendService",
    "sap/ui/model/json/JSONModel"
], (UIComponent, models, BackendService, JSONModel) => {
    "use strict";

    return UIComponent.extend("certificados.ccb.org.ccbcertvolantes.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            // Obtener datos del usuario logueado desde Work Zone / Fiori Launchpad
            var oUserData = { id: "", email: "", fullName: "" };
            if (sap.ushell && sap.ushell.Container) {
                var oUserInfo = sap.ushell.Container.getService("UserInfo");
                oUserData.id       = oUserInfo.getId()       || "";
                oUserData.email    = oUserInfo.getEmail()    || "";
                oUserData.fullName = oUserInfo.getFullName() || "";
            }

            console.log("Datos del usuario logueado:", oUserData);

            // Crear modelo global para datos del servicio
            var oGlobalDataModel = new JSONModel({
                userLogin: oUserData,  // Datos del usuario actual (Work Zone / Launchpad)
                userData: null,        // Respuesta del servicio DatosBasicosCertLabSet
                aniosVolante: []       // Colección de años disponibles (AnioVolanteSet), cargada una sola vez
            });
            this.setModel(oGlobalDataModel, "globalData");

            // Cargar la colección de años una única vez al iniciar la app
            var oBackendService = new BackendService();
            oBackendService.getYears()
                .then(function (aAnios) {
                    oGlobalDataModel.setProperty("/aniosVolante", aAnios);
                })
                .catch(function (oError) {
                    console.error("Error al consultar los años de volantes:", oError);
                });
        }
    });
});