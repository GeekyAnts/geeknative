import Foundation
import Testing
@testable import App

/// Answers every request made through URLSession.shared with a canned response, and records the URLs.
private nonisolated final class StubURLProtocol: URLProtocol {
    nonisolated(unsafe) static var status = 200
    nonisolated(unsafe) static var body = Data("[]".utf8)
    nonisolated(unsafe) static var requests: [URLRequest] = []

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        Self.requests.append(request)
        let response = HTTPURLResponse(url: request.url!, statusCode: Self.status, httpVersion: nil, headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Self.body)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

@Suite("ApiTasksRepository", .serialized)
struct ApiTasksRepositoryTests {
    private func withStub(status: Int, body: String, _ run: () async throws -> Void) async rethrows {
        StubURLProtocol.status = status
        StubURLProtocol.body = Data(body.utf8)
        StubURLProtocol.requests = []
        URLProtocol.registerClass(StubURLProtocol.self)
        defer { URLProtocol.unregisterClass(StubURLProtocol.self) }
        try await run()
    }

    @Test("AC-tasks-4: listTasks sends the status and priority filters as query parameters")
    func sendsFilters() async throws {
        try await withStub(status: 200, body: "[]") {
            _ = try await ApiTasksRepository().list(filter: TaskFilter(status: .inProgress, priority: .high))
            let url = try #require(StubURLProtocol.requests.last?.url)
            let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
            #expect(url.path == "/tasks")
            #expect(items.contains(URLQueryItem(name: "status", value: "inProgress")))
            #expect(items.contains(URLQueryItem(name: "priority", value: "high")))

            _ = try await ApiTasksRepository().list(filter: TaskFilter())
            #expect(StubURLProtocol.requests.last?.url?.query == nil)
        }
    }

    @Test("AC-task-detail-4: a 404 from the server becomes TasksError.notFound")
    func mapsNotFound() async {
        await withStub(status: 404, body: #"{"code":"not_found","message":"Task not found"}"#) {
            await #expect(throws: TasksError.notFound) {
                _ = try await ApiTasksRepository().get(id: "missing")
            }
        }
    }
}
