import { Data, InitResponse, Response, StepResponse } from './CloudObjects'

export async function preAuthorizer(data: Data): Promise<Response> {
    return { statusCode: 200 }
}

export async function init(data: Data): Promise<InitResponse> {
    return { state: { public: { items: [] } } }
}

export async function getState(data: Data): Promise<Response> {
    return { statusCode: 200, body: data.state }
}

// TODO

export async function add(data: Data): Promise<StepResponse> {
    const nextId = data.state.public.lastId ? data.state.public.lastId + 1 : 1
    data.state.public = {
        lastId: nextId,
        items: [
            ...data.state.public.items,
            {
                id: nextId,
                text: data.method.request.todoItem,
                isCompleted: false
            }
        ]
    }

    return data
}

export async function changeItemStatus(data: Data): Promise<StepResponse> {
    // Find item and change its status
    let itemIndex = data.state.public.items.findIndex(i => i.id === data.method.request.id)
    if (itemIndex >= 0) {
        data.state.public.items[itemIndex].isCompleted = data.method.request.isCompleted
    }
    return data
}

export async function remove(data: Data): Promise<StepResponse> {
    // Find item and change its status
    let itemIndex = data.state.public.items.findIndex(i => i.id === data.method.request.id)
    if (itemIndex >= 0) {
        data.state.public.items.splice(itemIndex, 1)
    }
    return data
}