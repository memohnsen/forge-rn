//
//  OuraKeychain.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import Foundation
import SimpleKeychain

class OuraKeychain {
    static let shared = OuraKeychain()
    private let keychain: SimpleKeychain
    private let service = "com.memohnsen.forge.oura"
    
    private init() {
        keychain = SimpleKeychain(service: service)
    }
    
    func saveAccessToken(_ token: String, userId: String) throws {
        let key = "access_token_\(userId)"
        try keychain.set(token, forKey: key)
    }
    
    func getAccessToken(userId: String) -> String? {
        let key = "access_token_\(userId)"
        return try? keychain.string(forKey: key)
    }
    
    func deleteAccessToken(userId: String) throws {
        let key = "access_token_\(userId)"
        try keychain.deleteItem(forKey: key)
    }
    
    func saveRefreshToken(_ token: String, userId: String) throws {
        let key = "refresh_token_\(userId)"
        try keychain.set(token, forKey: key)
    }
    
    func getRefreshToken(userId: String) -> String? {
        let key = "refresh_token_\(userId)"
        return try? keychain.string(forKey: key)
    }
    
    func deleteRefreshToken(userId: String) throws {
        let key = "refresh_token_\(userId)"
        try keychain.deleteItem(forKey: key)
    }
    
    func deleteAllTokens(userId: String) throws {
        try deleteAccessToken(userId: userId)
        try deleteRefreshToken(userId: userId)
    }
}

