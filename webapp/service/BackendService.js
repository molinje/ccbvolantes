sap.ui.define([
    "sap/ui/base/Object"
], function (BaseObject) {
    "use strict";

    return BaseObject.extend("certificados.ccb.org.ccbcertvolantes.service.BackendService", {

        // Servicio OData V2 ZHCM_CERTIFICADOS_PERSONAL_WD_SRV, expuesto a través
        // del destination "DestToSAP_QAS" (ruta mapeada en xs-app.json / ui5.yaml)
        _datosBasicosUrl: "/sap/opu/odata/sap/ZHCM_CERTIFICADOS_PERSONAL_WD_SRV/DatosBasicosCertLabSet",
        _anioVolanteUrl: "/sap/opu/odata/sap/ZHCM_CERTIFICADOS_PERSONAL_WD_SRV/AnioVolanteSet",
        _volantesBinUrl: "/sap/opu/odata/sap/ZHCM_CERTIFICADOS_PERSONAL_WD_SRV/VolantesBinSet",
        _nominaEspecialUrl: "/sap/opu/odata/sap/ZHCM_CERTIFICADOS_PERSONAL_WD_SRV/NominaEspecialSet",

        /**
         * Retorna la URL base de la app, respetando el subpath con el que fue
         * desplegada (html5-apps-repo / Work Zone), igual que en solprestamos.
         * @returns {string} URL base de la app
         * @private
         */
        _getAppBase: function () {
            return sap.ui.require.toUrl("certificados/ccb/org/ccbcertvolantes");
        },

        /**
         * Consulta los datos básicos / certificado laboral de un empleado por su correo electrónico
         * GET DatosBasicosCertLabSet('<email>')?$format=json
         * @param {string} sEmail - Correo electrónico del empleado (clave del servicio)
         * @returns {Promise} Promise que resuelve con el JSON de respuesta del servicio OData
         */
        GetDataEmployee: function (sEmail) {
            var sId = String(sEmail || "").trim().toUpperCase();
            var sUrl = this._getAppBase() + this._datosBasicosUrl + "('" + sId + "')";

            return this._executeGet(sUrl, { "$format": "json" });
        },

        /**
         * Consulta la colección de años disponibles para los volantes de pago
         * GET AnioVolanteSet?$format=json
         * @returns {Promise<Array>} Promise que resuelve con un array de { Anio, DescAnio }
         */
        getYears: function () {
            var sUrl = this._getAppBase() + this._anioVolanteUrl;

            return this._executeGet(sUrl, { "$format": "json" })
                .then(function (oData) {
                    var aResults = (oData && oData.d && oData.d.results) || [];
                    return aResults.map(function (oItem) {
                        return {
                            Anio: oItem.Anio,
                            DescAnio: oItem.DescAnio
                        };
                    });
                });
        },

        /**
         * Arma la URL del volante de pago (binario/PDF), lista para abrir en una
         * nueva pestaña (window.open) o usar como href de descarga.
         * GET VolantesBinSet(Pernr='..',Periodo='..',Anio='..',PayOcsrn='..',Area_Nom='..')/$value
         * @param {object} oParams - { Pernr, Periodo, Anio, PayOcsrn, Area_Nom }
         * @returns {string} URL absoluta del volante
         */
        getVolanteUrl: function (oParams) {
            var sKeys = "Pernr='" + oParams.Pernr + "'," +
                "Periodo='" + oParams.Periodo + "'," +
                "Anio='" + oParams.Anio + "'," +
                "PayOcsrn='" + oParams.PayOcsrn + "'," +
                "Area_Nom='" + oParams.Area_Nom + "'";

            return this._getAppBase() + this._volantesBinUrl + "(" + sKeys + ")/$value";
        },

        /**
         * Consulta los tipos de pago (nómina especial) disponibles para un empleado,
         * en un Año y Periodo específicos.
         * GET NominaEspecialSet?$filter=Pernr eq '..' and Anio eq '..' and Periodo eq '..'&$format=json
         * @param {object} oParams - { Pernr, Anio, Periodo }
         * @returns {Promise<Array<{PayOcrsn: string, Descripcion: string}>>} Promise que resuelve con
         * una colección plana que contiene únicamente los campos PayOcrsn y Descripcion
         */
        getTiposPago: function (oParams) {
            var sPernr = String((oParams && oParams.Pernr) || "").trim();
            var sAnio = String((oParams && oParams.Anio) || "").trim();
            var sPeriodo = String((oParams && oParams.Periodo) || "").trim();

            var sUrl = this._getAppBase() + this._nominaEspecialUrl;
            var sFilter = "Pernr eq '" + sPernr + "' and Anio eq '" + sAnio + "' and Periodo eq '" + sPeriodo + "'";

            return this._executeGet(sUrl, { "$filter": sFilter, "$format": "json" })
                .then(function (oData) {
                    var aResults = (oData && oData.d && oData.d.results) || [];
                    return aResults.map(function (oItem) {
                        return {
                            PayOcrsn: oItem.PayOcrsn,
                            Descripcion: oItem.Descripcion
                        };
                    });
                });
        },

        /**
         * Ejecuta una petición GET al servicio OData con parámetros en la query string
         * @param {string} sUrl - URL base del servicio
         * @param {object} [oParams] - Parámetros a enviar en la query string (opcional)
         * @returns {Promise} Promise que resuelve con el JSON de respuesta
         * @private
         */
        _executeGet: function (sUrl, oParams) {
            return new Promise(function (resolve, reject) {
                var sQueryString = oParams ? Object.keys(oParams)
                    .map(function (sKey) {
                        return encodeURIComponent(sKey) + "=" + encodeURIComponent(oParams[sKey]);
                    })
                    .join("&") : "";

                var xhr = new XMLHttpRequest();
                xhr.open("GET", sQueryString ? (sUrl + "?" + sQueryString) : sUrl, true);
                xhr.setRequestHeader("Accept", "application/json");

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(xhr.responseText ? JSON.parse(xhr.responseText) : {});
                        } catch (e) {
                            resolve({ data: xhr.responseText, rawResponse: true });
                        }
                    } else if (xhr.status === 401) {
                        reject({
                            error: "Authentication failed",
                            status: xhr.status,
                            statusText: xhr.statusText,
                            message: "El token de acceso es inválido o ha expirado"
                        });
                    } else {
                        reject({
                            error: "Service request failed",
                            status: xhr.status,
                            statusText: xhr.statusText,
                            response: xhr.responseText
                        });
                    }
                };

                xhr.onerror = function () {
                    reject({
                        error: "Network error",
                        status: xhr.status,
                        message: "Error de red al conectar con el servicio"
                    });
                };

                xhr.send();
            });
        }
    });
});
