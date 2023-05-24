export abstract class ToggleableFeature {

    #status: boolean = false;


    constructor(defaultStatus: boolean) {

        this.#status = defaultStatus;

        this.onStatusUpdate();

    }


    getStatus(): boolean {
        return this.#status;
    }


    protected onStatusUpdate() { }


    toggleStatus(force?: boolean): void {

        if (force) {
            this.#status = force;
        } else {
            this.#status = !this.#status;
        }

        this.onStatusUpdate();

    }

}