import AbstractModel from './AbstractModel';
import Properties from '../Configuration/Tag';

export default class Tag extends AbstractModel {

    /**
     *
     * @param {Api} api
     * @param {Object} [data={}]
     */
    constructor(api, data = {}) {
        super(Properties, data);
        this._api = api;
    }

    getId() {
        return this._getProperty('id');
    }

    setId(value) {
        return this._setProperty('id', value);
    }

    getLabel() {
        return this._getProperty('label');
    }

    setLabel(value) {
        return this._setProperty('label', value);
    }

    getColor() {
        return this._getProperty('color');
    }

    setColor(value) {
        return this._setProperty('color', value);
    }

    /**
     *
     * @returns {Server}
     */
    getServer() {
        return this._api.getServer();
    }

    /**
     *
     * @returns {Promise<Tag[]>}
     */
    async fetchRevisions() {

    }

    /**
     *
     * @returns {Promise<Password[]>}
     */
    async fetchPasswords() {

    }
}