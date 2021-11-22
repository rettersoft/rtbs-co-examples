
import { Data, StepResponse } from './CloudObjects'

export async function update(data: Data): Promise<StepResponse> {
    data.state.private.name = data.method.request.name
    return data
}