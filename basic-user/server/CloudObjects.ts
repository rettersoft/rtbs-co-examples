interface KeyValue {
    [key: string]: any
}

interface Configuration {
    stepLimit?: number
}

interface OperationResponse {
    success: boolean
    data?: any
    error?: string
}

export interface Response {
    statusCode: number
    body?: any
    headers?: { [key: string]: string }
}

export interface Context {
    requestId: string
    projectId: string
    action: string
    identity: string
    serviceId?: string
    payload?: KeyValue
    headers?: KeyValue
    classId: string
    instanceId?: string
    methodName: string
    refererClassId?: string
    refererInstanceId?: string
    refererMethodName?: string
    refererUserId?: string
    refererServiceId?: string
    refererIdentity?: string
    claims?: KeyValue
    isAnonymous?: boolean
    culture?: string
    platform?: string
    userId?: string
    sourceIP: string
    sessionId?: string
    clientOs?: string
    targetServiceIds?: string[]
    relatedUserId?: string
}

interface State {
    public?: KeyValue
    private?: KeyValue
    user?: KeyValue
    role?: KeyValue
}

interface Method {
    name: string
    context: Context
    state: KeyValue
    request?: KeyValue
    response?: Response
}

interface StepResponseMethod {
    state?: KeyValue
    response?: Response
}

interface RbsActionResponse {
    errorCode: string
    serviceId: string
    status: number
    errors: string[]
    response: any
    durationInMilliseconds: number
    executionDurationInMilliseconds: number
    headers: { [key: string]: string }
    isExtract: boolean
}

interface RbsAction {
    name: string
    data?: KeyValue
    targetServiceIds?: string[]
    headers?: {
        classId: string
        instanceId: string
    }
    response?: RbsActionResponse[]
}

interface GetGlobalMemory {
    key: string
    response?: OperationResponse
}

interface SetGlobalMemory extends GetGlobalMemory {
    value: string
}

enum PublicFileTTL {
    _,
    DAY_1,
    DAY_3,
    DAY_7,
    DAY_15,
}

interface GetFile {
    filename: string
    ttl?: PublicFileTTL
    isBuffer?: boolean
    response?: OperationResponse
}

interface SetFile extends GetFile {
    body: any
    contentType?: string
    isBase64?: boolean
    isPublic?: boolean
    response?: OperationResponse
}
interface LookUpKey {
    key: {
        name: string
        value: string
    }
    response?: {
        success: boolean
        data?: {
            instanceId: string
        }
        error?: string
    }
}

interface MethodCall {
    classId?: string
    instanceId?: string
    methodName: string
    payload?: KeyValue
    response?: OperationResponse
}

export interface InitResponse {
    state?: State
    config?: Configuration
}

export interface OperationsInput {
    rbsAction?: RbsAction[]
    getGlobalMemory?: GetGlobalMemory[]
    setGlobalMemory?: SetGlobalMemory[]
    getFile?: GetFile[]
    setFile?: SetFile[]
    getLookUpKey?: LookUpKey[]
    setLookUpKey?: LookUpKey[]
    methodCall?: MethodCall[]
}

export interface OperationsOutput {
    rbsAction?: RbsActionResponse[]
    getGlobalMemory?: OperationResponse[]
    setGlobalMemory?: OperationResponse[]
    getFile?: OperationResponse[]
    setFile?: OperationResponse[]
    getLookUpKey?: OperationResponse[]
    setLookUpKey?: OperationResponse[]
    methodCall?: OperationResponse[]
}

export interface StepResponse {
    state?: State
    method?: StepResponseMethod
    nextFlowId?: string
}

export interface Data extends StepResponse {
    context: Context
    env: KeyValue
    config: Configuration
    version: number
    state: State
    method: Method
}

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
const lambda = new LambdaClient({})

async function invokeLambda(payload: OperationsInput): Promise<OperationsOutput> {
    const { OPERATIONS_LAMBDA, CLOUD_OBJECTS_TOKEN } = process.env
    return lambda
        .send(
            new InvokeCommand({
                FunctionName: OPERATIONS_LAMBDA!,
                Payload: new TextEncoder().encode(JSON.stringify({ data: payload, token: CLOUD_OBJECTS_TOKEN! })),
            }),
        )
        .then(({ FunctionError: e, Payload: response }) => {
            if (e) throw new Error(e)

            const resp = new TextDecoder('utf-8').decode(response) || '{}'
            return JSON.parse(resp) as OperationsOutput
        })
}

export default class CloudObjectsOperator {
    pipeline(): CloudObjectsPipeline {
        return new CloudObjectsPipeline()
    }

    private sendSingleOperation(input: any, operationType: string) {
        return invokeLambda({ [operationType]: [input] }).then((r) => r[operationType]?.pop())
    }
    async rbsAction(input: RbsAction): Promise<RbsActionResponse | undefined> {
        return this.sendSingleOperation(input, this.rbsAction.name)
    }
    async methodCall(input: MethodCall): Promise<OperationResponse | undefined> {
        return this.sendSingleOperation(input, this.methodCall.name)
    }
    async getLookUpKey(input: LookUpKey): Promise<OperationResponse | undefined> {
        return this.sendSingleOperation(input, this.getLookUpKey.name)
    }
    async setLookUpKey(input: LookUpKey): Promise<OperationResponse | undefined> {
        return this.sendSingleOperation(input, this.setLookUpKey.name)
    }
    async setGlobalMemory(input: SetGlobalMemory): Promise<OperationResponse | undefined> {
        return this.sendSingleOperation(input, this.setGlobalMemory.name)
    }
    async getGlobalMemory(input: GetGlobalMemory): Promise<OperationResponse | undefined> {
        return this.sendSingleOperation(input, this.getGlobalMemory.name)
    }
    async getFile(input: GetFile): Promise<OperationResponse | undefined> {
        return this.sendSingleOperation(input, this.getFile.name)
    }
    async setFile(input: SetFile): Promise<OperationResponse | undefined> {
        return this.sendSingleOperation(input, this.setFile.name)
    }
}

class CloudObjectsPipeline {
    private payload: OperationsInput = {}
    rbsAction(input: RbsAction): CloudObjectsPipeline {
        if (!this.payload.rbsAction) this.payload.rbsAction = []
        this.payload.rbsAction.push(input)
        return this
    }

    methodCall(input: MethodCall): CloudObjectsPipeline {
        if (!this.payload.methodCall) this.payload.methodCall = []
        this.payload.methodCall.push(input)
        return this
    }

    getLookUpKey(input: LookUpKey): CloudObjectsPipeline {
        if (!this.payload.getLookUpKey) this.payload.getLookUpKey = []
        this.payload.getLookUpKey.push(input)
        return this
    }

    setLookUpKey(input: LookUpKey): CloudObjectsPipeline {
        if (!this.payload.setLookUpKey) this.payload.setLookUpKey = []
        this.payload.setLookUpKey.push(input)
        return this
    }

    getGlobalMemory(input: GetGlobalMemory): CloudObjectsPipeline {
        if (!this.payload.getGlobalMemory) this.payload.getGlobalMemory = []
        this.payload.getGlobalMemory.push(input)
        return this
    }

    setGlobalMemory(input: SetGlobalMemory): CloudObjectsPipeline {
        if (!this.payload.setGlobalMemory) this.payload.setGlobalMemory = []
        this.payload.setGlobalMemory.push(input)
        return this
    }

    getFile(input: GetFile): CloudObjectsPipeline {
        if (!this.payload.getFile) this.payload.getFile = []
        this.payload.getFile.push(input)
        return this
    }

    setFile(input: SetFile): CloudObjectsPipeline {
        if (!this.payload.setFile) this.payload.setFile = []
        this.payload.setFile.push(input)
        return this
    }
    async send(): Promise<OperationsOutput> {
        return invokeLambda(this.payload).then((r) => {
            this.payload = {}
            return r
        })
    }
}
