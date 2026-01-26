//
//  CheckEntitlement.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/27/25.
//

import Foundation
import RevenueCat

@Observable
class CustomerInfoManager: NSObject, PurchasesDelegate {
    var customerInfo: CustomerInfo?
    var isLoading = false
    var errorMessage: String?
    var hasProAccess = false {
        didSet {
            UserDefaults.standard.set(hasProAccess, forKey: "cachedHasProAccess")
        }
    }
    private var isDelegateSet = false
    
    override init() {
        super.init()
        hasProAccess = UserDefaults.standard.bool(forKey: "cachedHasProAccess")
    }

    func setupDelegate() {
        guard !isDelegateSet else { return }
        Purchases.shared.delegate = self
        isDelegateSet = true
        #if DEBUG
        print("🔔 CustomerInfoManager set as delegate")
        #endif
    }

    @MainActor
    func fetchCustomerInfo() async {
        isLoading = true
        errorMessage = nil

        do {
            let customerInfo = try await Purchases.shared.customerInfo()
            self.customerInfo = customerInfo
            
            // Check if user has any active entitlements
            hasProAccess = !customerInfo.entitlements.active.isEmpty
            
            #if DEBUG
            print("Customer info fetched. Has Pro Access: \(hasProAccess)")
            print("Active entitlements: \(customerInfo.entitlements.active.keys)")
            #endif
        } catch {
            errorMessage = error.localizedDescription
            hasProAccess = false
            #if DEBUG
            print("Error fetching customer info: \(error)")
            #endif
        }

        isLoading = false
    }
    
    // PurchasesDelegate method
    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        #if DEBUG
        print("🔔 PurchasesDelegate: receivedUpdated called")
        print("🔔 Active entitlements: \(customerInfo.entitlements.active.keys)")
        print("🔔 Has any active entitlements: \(!customerInfo.entitlements.active.isEmpty)")
        #endif
        
        Task { @MainActor in
            self.customerInfo = customerInfo
            self.hasProAccess = !customerInfo.entitlements.active.isEmpty
            
            #if DEBUG
            print("🔔 Manager updated. Has Pro Access: \(self.hasProAccess)")
            #endif
        }
    }
}

