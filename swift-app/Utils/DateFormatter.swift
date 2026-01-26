//
//  DateFormatter.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/26/25.
//

import Foundation
import SwiftUI

func dateFormat(_ eventDate: String) -> String? {
    let strip = String(eventDate.prefix(10))
    
    let inputFormatter = DateFormatter()
    inputFormatter.dateFormat = "y-MM-dd"
    inputFormatter.locale = Locale(identifier: "en_US_POSIX")
    
    guard let date = inputFormatter.date(from: strip) else {
        return nil
    }
    
    let outputFormatter = DateFormatter()
    outputFormatter.dateFormat = "MMM d, y"
    outputFormatter.locale = Locale(identifier: "en_US_POSIX")
    
    let formattedDate = outputFormatter.string(from: date)
    
    return formattedDate
}
