import ApiResponse from './ApiResponse';

export default class ApiRequest {

    constructor(api, url = null, session = null) {
        this._api = api;
        this._url = url;
        this._path = null;
        this._data = null;
        this._session = session;
        this._responseType = 'application/json';
    }

    setUrl(value) {
        this._url = value;

        return this;
    }

    /**
     * @returns {Session}
     */
    getSession() {
        return this._session;
    }

    /**
     *
     * @param {Session} value
     * @returns {ApiRequest}
     */
    setSession(value) {
        this._session = value;

        return this;
    }

    setPath(value) {
        this._path = value;

        return this;
    }

    setData(value) {
        this._data = value;

        return this;
    }

    /**
     *
     * @returns {Promise<ApiResponse>}
     */
    async send() {
        let options = this._getRequestOptions();
        let httpResponse = await this._executeRequest(this._url + this._path, options);
        let expectedContentType = options.headers.get('content-type');
        let contentType = httpResponse.headers.get('content-type');

        let response = new ApiResponse()
            .setContentType(contentType)
            .setHeaders(httpResponse.headers)
            .setHttpStatus(httpResponse.status)
            .setHttpResponse(httpResponse);

        this._session.setId(httpResponse.headers.get('x-api-session'));

        if(expectedContentType !== null && contentType && contentType.indexOf(expectedContentType) === -1) {
            let error = this._api.getClass('exception.contenttype', expectedContentType, contentType, httpResponse);
            this._api.emit('request.error', error);
            throw error;
        } else if(contentType && contentType.indexOf('application/json') !== -1) {
            await this._processJsonResponse(httpResponse, response);
        } else {
            await this._processBinaryResponse(httpResponse, response);
        }

        this._api.emit('request.after', response);

        return response;
    }

    _getRequestOptions() {
        let headers = this._getRequestHeaders();
        let method = 'GET';
        let options = {method, headers, credentials: 'omit', redirect: 'error'};
        if(this._data !== null) {
            options.body = JSON.stringify(this._data);
            method = 'POST';
        }
        options.method = method;

        return options;
    }

    _getRequestHeaders() {
        let headers = new Headers();

        if(this._session.getUser() !== null) {
            headers.append('authorization', `Basic ${btoa(`${this._session.getUser()}:${this._session.getToken()}`)}`);
        } else if(this._session.getToken() !== null) {
            headers.append('authorization', `Bearer ${btoa(this._session.getToken())}`);
        }

        headers.append('accept', this._responseType);

        if(this._data !== null) {
            headers.append('content-type', 'application/json');
        }

        if(this._session.getId() !== null) {
            headers.append('x-api-session', this._session.getId());
        }

        return headers;
    }

    /**
     *
     * @param url
     * @param options
     * @returns {Promise<Response>}
     * @private
     */
    async _executeRequest(url, options) {
        try {
            let request = new Request(url, options);
            this._api.emit('request.before', request);

            return await fetch(request);
        } catch(e) {
            this._api.emit('request.error', e);
            throw e;
        }
    }

    /**
     *
     * @param {Response} httpResponse
     * @param {ApiResponse} response
     * @private
     */
    async _processJsonResponse(httpResponse, response) {
        if(!httpResponse.ok) {
            let error = this._getHttpError(httpResponse);
            this._api.emit('request.error', error);
            throw error;
        }

        try {
            let json = await httpResponse.json();
            response.setData(json);
        } catch(e) {
            let error = this._api.getClass('exception.decoding', httpResponse, e);
            this._api.emit('request.decoding.error', error);
            throw error;
        }
    }

    /**
     *
     * @param {Response} httpResponse
     * @param {ApiResponse} response
     * @private
     */
    async _processBinaryResponse(httpResponse, response) {
        if(!httpResponse.ok) {
            let error = this._getHttpError(httpResponse);
            this._api.emit('request.error', error);
            throw error;
        }

        try {
            let blob = await httpResponse.blob();
            response.setData(blob);
        } catch(e) {
            let error = this._api.getClass('exception.decoding', httpResponse, e);
            this._api.emit('request.decoding.error', error);
            throw error;
        }
    }

    /**
     *
     * @param {Response} response
     * @private
     */
    _getHttpError(response) {
        if([400, 401, 403, 404, 405, 429, 500, 502, 503, 504].indexOf(response.status) !== -1) {
            return this._api.getClass(`exception.${response.status}`, response);
        }
        if(response.status > 99) {
            return this._api.getClass('exception.http', response);
        }

        return this._api.getClass('exception.network', response);
    }
}