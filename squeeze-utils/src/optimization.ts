import * as optimjs from 'optimization-js'

export enum OptimizationAlgorithm {
    OMG = 'OMG',
    RANDOM = 'random',
    GRID = 'GRID',
    ALL = 'ALL'
}


export abstract class BaseOptVar<T = any> {
    abstract numVariants(): number;
    abstract toOptimizationJs(): any;
    abstract valueAtIndex(idx: number): T;
}

export class IntegerOptVar implements BaseOptVar<number> {
    constructor(private _low: number, private _high: number) {

    }

    numVariants(): number {
        return this._high - this._low + 1;
    }

    toOptimizationJs() {
        return optimjs.Integer(this._low, this._high);
    }

    valueAtIndex(idx: number): number {
        return this._low + idx;
    }
}

export class CategoricalOptVar<T> implements BaseOptVar<T> {
    constructor(private _categories: T[]) {

    }

    numVariants(): number {
        return this._categories.length;
    }

    toOptimizationJs() {
        return optimjs.Categorical(this._categories);
    }

    valueAtIndex(idx: number): T {
        return this._categories[idx];
    }
}

export class ConstantOptVar<T> implements BaseOptVar<T> {
    constructor(private _value: T) {

    }

    numVariants(): number {
        return 1;
    }

    toOptimizationJs() {
        return optimjs.Categorical([this._value]);
    }

    valueAtIndex(idx: number): T {
        return this._value;
    }
}


// does a GRID optimization, follows optimization-js concept
export class GridOptimizer {
    private _currentVariant: number;
    private _variantStepSize: number;

    constructor(private _variables: BaseOptVar[], iterations: number) {
        const totalVariants = _variables.reduce((p, c) => p * c.numVariants(), 1)
        this._variantStepSize = totalVariants / (iterations - 1);
        this._currentVariant = 0;
    }

    ask(): any[] {
        const result = [];
        let currentVariantInt = Math.round(this._currentVariant);
        for (const v of this._variables) {
            const numVariants = v.numVariants();
            result.push(v.valueAtIndex(currentVariantInt % numVariants));
            currentVariantInt = Math.floor(currentVariantInt / numVariants);
        }

        this._currentVariant += this._variantStepSize;
        return result;
    }

    tell(a: any[], b: [number]) {
        // ignore
    } 
}

// does a ALL optimization, follows optimization-js concept
export class AllOptimizer {
    private _currentVariant: number;

    constructor(private _variables: BaseOptVar[], iterations: number) {
        const totalVariants = _variables.reduce((p, c) => p * c.numVariants(), 1)
        this._currentVariant = 0;
    }

    ask(): any[] {
        const result = [];
        let currentVariantInt = this._currentVariant;
        for (const v of this._variables) {
            const numVariants = v.numVariants();
            result.push(v.valueAtIndex(currentVariantInt % numVariants));
            currentVariantInt = Math.floor(currentVariantInt / numVariants);
        }

        this._currentVariant += 1;
        return result;
    }

    tell(a: any[], b: [number]) {
        // ignore
    } 
}


export const OptimizersMap: {[name: string]: any} = {
    [OptimizationAlgorithm.RANDOM]: (dims: BaseOptVar[], iterations: number) => optimjs.RandomOptimizer(dims.map(e => e.toOptimizationJs())),
    [OptimizationAlgorithm.OMG]: (dims: BaseOptVar[], iterations: number) => optimjs.OMGOptimizer(dims.map(e => e.toOptimizationJs())),
    [OptimizationAlgorithm.GRID]: (dims: BaseOptVar[], iterations: number) => new GridOptimizer(dims, iterations),
    [OptimizationAlgorithm.ALL]: (dims: BaseOptVar[], iterations: number) => new AllOptimizer(dims, iterations)
}
