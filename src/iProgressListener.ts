export abstract class IProgressListener {
    abstract onProgressUpdated(currentValue: number, total: number);
}