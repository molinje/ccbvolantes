sap.ui.define([
    "sap/ui/core/UIComponent",
    "certificados/ccb/org/ccbcertvolantes/model/models",
    "sap/ui/model/json/JSONModel"
], (UIComponent, models, JSONModel) => {
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
                userData: null         // Respuesta del servicio DatosBasicosCertLabSet
            });
            this.setModel(oGlobalDataModel, "globalData");
        }
    });
});