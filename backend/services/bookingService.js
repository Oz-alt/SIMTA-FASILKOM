/**
 * SIMTA Backend Service - Room Defense Booking & Priority Recommendation Logic
 */

export const STAGE_TYPES = {
  SEMINAR_PROPOSAL: 'seminar_proposal',
  SEMINAR_HASIL: 'seminar_hasil',
  SIDANG_AKHIR: 'sidang_akhir'
};

export const STAGE_LABELS = {
  seminar_proposal: 'Seminar Proposal',
  seminar_hasil: 'Seminar Hasil',
  sidang_akhir: 'Sidang Akhir'
};

/**
 * Checks for schedule time slot overlap on the same room and date.
 */
export function checkBookingCollision(existingBookings, roomId, date, startTime, endTime) {
  const matchingDateBookings = existingBookings.filter(
    b => b.room_id === roomId && 
         b.booking_date === date && 
         b.status !== 'ditolak' && 
         b.status !== 'dibatalkan'
  );

  for (const b of matchingDateBookings) {
    const bStart = b.start_time;
    const bEnd = b.end_time;
    
    // Overlap condition: start1 < end2 AND end1 > start2
    if (startTime < bEnd && endTime > bStart) {
      return {
        hasCollision: true,
        conflictingBooking: b
      };
    }
  }

  return { hasCollision: false, conflictingBooking: null };
}

/**
 * Recommends available rooms based on priority order configured for department & stage type.
 */
export function getRecommendedRooms(rooms, priorities, departmentId, stageType, existingBookings, date, startTime, endTime) {
  // Filter priorities for specific department & stage
  const deptPriorities = priorities.filter(
    p => p.department_id === departmentId && p.stage_type === stageType
  ).sort((a, b) => a.priority_order - b.priority_order);

  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const recommendations = [];

  for (const p of deptPriorities) {
    const room = roomMap.get(p.room_id);
    if (!room || room.status !== 'aktif') continue;

    const collision = checkBookingCollision(existingBookings, room.id, date, startTime, endTime);
    
    recommendations.push({
      room,
      priorityOrder: p.priority_order,
      isAvailable: !collision.hasCollision,
      conflict: collision.conflictingBooking
    });
  }

  return recommendations;
}
