import { Toast } from 'duoyun-ui/elements/toast';
import { debounce } from 'duoyun-ui/lib/timer';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { documentVisible, playHintSound, playSound } from 'src/utils/common';
import { globalEvents, Signal, COMMAND, dispatchGlobalEvent } from 'src/constants';
import {
  AcceptFriend,
  AcceptFriendMutation,
  AcceptFriendMutationVariables,
  AcceptInvite,
  AcceptInviteMutation,
  AcceptInviteMutationVariables,
  ApplyFriend,
  ApplyFriendMutation,
  ApplyFriendMutationVariables,
  CreateComment,
  CreateCommentMutation,
  CreateCommentMutationVariables,
  CreateInvite,
  CreateInviteMutation,
  CreateInviteMutationVariables,
  CreateMessage,
  CreateMessageMutation,
  CreateMessageMutationVariables,
  CreateRoom,
  CreateRoomMutation,
  CreateRoomMutationVariables,
  EnterLobby,
  EnterLobbyMutation,
  EnterLobbyMutationVariables,
  EnterPubRoom,
  EnterPubRoomMutation,
  EnterPubRoomMutationVariables,
  Event,
  EventSubscription,
  FavoriteGame,
  FavoriteGameMutation,
  FavoriteGameMutationVariables,
  GetAccount,
  GetAccountQuery,
  GetAccountQueryVariables,
  GetRecord,
  GetRecordQuery,
  GetRecordQueryVariables,
  GetFriends,
  GetFriendsQuery,
  GetFriendsQueryVariables,
  GetGameIds,
  GetGameIdsQuery,
  GetGameIdsQueryVariables,
  GetMessages,
  GetMessagesQuery,
  GetMessagesQueryVariables,
  LeaveLobby,
  LeaveLobbyMutation,
  LeaveLobbyMutationVariables,
  LeaveRoom,
  LeaveRoomMutation,
  LeaveRoomMutationVariables,
  ReadMessage,
  ReadMessageMutation,
  ReadMessageMutationVariables,
  ScFriendStatus,
  ScNewComment,
  ScNewInvite,
  ScNewRoom,
  ScUpdatePassword,
  ScUpdateRoom,
  ScUpdateRoomScreenshot,
  ScVoiceMsgKind,
  SendLobbyMsg,
  SendLobbyMsgMutation,
  SendLobbyMsgMutationVariables,
  SendSignal,
  SendSignalMutation,
  SendSignalMutationVariables,
  SendVoiceMsg,
  SendVoiceMsgMutation,
  SendVoiceMsgMutationVariables,
  UpdateAccount,
  UpdateAccountMutation,
  UpdateAccountMutationVariables,
  UpdatePassword,
  UpdatePasswordMutation,
  UpdatePasswordMutationVariables,
  UpdateRoom,
  UpdateRoomMutation,
  UpdateRoomMutationVariables,
  UpdateRoomScreenshot,
  UpdateRoomScreenshotMutation,
  UpdateRoomScreenshotMutationVariables,
} from 'src/generated/graphql';
import { store, updateStore, friendStore, updateFriendStore, convertGame } from 'src/store';
import { request, subscribe } from 'src/services';
import { configure, updateConfigureStore, parseAccount, Settings } from 'src/configure';
import { i18n, isCurrentLang } from 'src/i18n/basic';
import { gotoLogin, logout } from 'src/auth';
import { getGames } from 'src/services/guest-api';

export const enterLobby = async () => {
  const { enterLobby } = await request<EnterLobbyMutation, EnterLobbyMutationVariables>(EnterLobby, {
    input: { area: i18n.currentLanguage.split('-')[0] },
  });
  updateStore({ lobbyInfo: enterLobby });
};

export const leaveLobby = async () => {
  request<LeaveLobbyMutation, LeaveLobbyMutationVariables>(LeaveLobby, {}, { ignoreError: true });
};

export const sendLobbyMsg = async (text: string) => {
  await request<SendLobbyMsgMutation, SendLobbyMsgMutationVariables>(SendLobbyMsg, { input: { text } });
  updateStore({
    lobbyMessage: [
      ...store.lobbyMessage,
      {
        createdAt: Date.now(),
        userId: configure.user!.id,
        username: configure.user!.username,
        nickname: configure.user!.nickname,
        text,
      },
    ],
  });
};

export const sendVoiceMsg = async (kind: ScVoiceMsgKind, payload: RTCSessionDescription | RTCIceCandidate) => {
  await request<SendVoiceMsgMutation, SendVoiceMsgMutationVariables>(SendVoiceMsg, {
    input: { json: JSON.stringify(payload), kind },
  });
};

export const getGameIds = async () => {
  if (!store.gameIds?.length) await getGames();
  const { topGames, favorites, recentGames } = await request<GetGameIdsQuery, GetGameIdsQueryVariables>(GetGameIds, {});

  updateStore({
    favoriteIds: favorites.filter((id) => isCurrentLang(store.games[id]!)),
    topGameIds: [...new Set([...topGames, ...store.gameIds!])]
      .filter((id) => isCurrentLang(store.games[id]!))
      .splice(0, 5),
    recentGameIds: recentGames.filter((id) => isCurrentLang(store.games[id]!)),
  });
};

export const createRoom = async (input: ScNewRoom) => {
  if (!configure.user) return gotoLogin();
  if (COMMAND === 'serve') input.private = true;
  const { createRoom } = await request<CreateRoomMutation, CreateRoomMutationVariables>(CreateRoom, { input });
  configure.user!.playing = createRoom;
  updateConfigureStore();
  updateStore({
    recentGameIds: [input.gameId, ...(store.recentGameIds || []).filter((id) => id !== input.gameId)],
  });
};

export const updateRoom = async (input: ScUpdateRoom) => {
  const { updateRoom } = await request<UpdateRoomMutation, UpdateRoomMutationVariables>(UpdateRoom, { input });
  configure.user!.playing = updateRoom;
  updateConfigureStore();
};

export const updateRoomScreenshot = async (input: ScUpdateRoomScreenshot) => {
  request<UpdateRoomScreenshotMutation, UpdateRoomScreenshotMutationVariables>(
    UpdateRoomScreenshot,
    {
      input,
    },
    {
      ignoreError: true,
    },
  );
};

export const enterPubRoom = async (roomId: number) => {
  if (!configure.user) return gotoLogin();
  const { enterPubRoom } = await request<EnterPubRoomMutation, EnterPubRoomMutationVariables>(EnterPubRoom, {
    input: { roomId },
  });
  configure.user!.playing = enterPubRoom;
  updateConfigureStore();
  updateStore({
    recentGameIds: [enterPubRoom.gameId, ...(store.recentGameIds || []).filter((id) => id !== enterPubRoom.gameId)],
  });
};

export const leaveRoom = async () => {
  await request<LeaveRoomMutation, LeaveRoomMutationVariables>(LeaveRoom, {});
  delete configure.user!.playing;
  updateConfigureStore();
};

export const getAccount = async () => {
  const { account } = await request<GetAccountQuery, GetAccountQueryVariables>(GetAccount, {});
  updateConfigureStore({
    user: parseAccount(account),
  });
};

export const updateAccount = async ({
  nickname = configure.user!.nickname,
  settings = configure.user!.settings,
}: {
  nickname?: string;
  settings?: Settings;
}) => {
  const { updateAccount } = await request<UpdateAccountMutation, UpdateAccountMutationVariables>(UpdateAccount, {
    input: { nickname, settings: JSON.stringify(settings) },
  });
  updateConfigureStore({
    user: parseAccount(updateAccount),
  });
};

export const updatePassword = async (input: ScUpdatePassword) => {
  await request<UpdatePasswordMutation, UpdatePasswordMutationVariables>(UpdatePassword, {
    input,
  });
};

export const getFriends = async () => {
  const { friends, invites } = await request<GetFriendsQuery, GetFriendsQueryVariables>(GetFriends, {});
  updateFriendStore({
    friendIds: friends.map((e) => {
      friendStore.friends[e.user.id] = e;
      return e.user.id;
    }),
    inviteIds: invites.map((e) => {
      friendStore.invites[e.id] = e;
      return e.id;
    }),
  });
};

export const applyFriend = async (username: string) => {
  await request<ApplyFriendMutation, ApplyFriendMutationVariables>(ApplyFriend, { input: { username } });
  Toast.open('default', i18n.get('tip.friend.applySuccess', username));
};

export const acceptFriend = async (targetId: number, accept: boolean) => {
  await request<AcceptFriendMutation, AcceptFriendMutationVariables>(AcceptFriend, { input: { targetId, accept } });
  if (accept) {
    friendStore.friends[targetId] = { ...friendStore.friends[targetId]!, status: ScFriendStatus.Accept };
  } else {
    friendStore.friendIds = friendStore.friendIds?.filter((id) => id !== targetId);
    delete friendStore.friends[targetId];
  }
  updateFriendStore();
};

export const deleteFriend = async (targetId: number) => {
  await acceptFriend(targetId, false);
  friendStore.messageIds[targetId]?.forEach((id) => delete friendStore.messages[id]);
  updateFriendStore({
    draft: { ...friendStore.draft, [targetId]: undefined },
    messageIds: { ...friendStore.messageIds, [targetId]: undefined },
  });
};

export const createInvite = async (input: ScNewInvite) => {
  await request<CreateInviteMutation, CreateInviteMutationVariables>(CreateInvite, { input });
  Toast.open('success', i18n.get('tip.friend.invited'));
};

export const acceptInvite = async (inviteId: number, accept: boolean) => {
  await request<AcceptInviteMutation, AcceptInviteMutationVariables>(AcceptInvite, { input: { inviteId, accept } });
  if (accept) {
    configure.user!.playing = friendStore.invites[inviteId]?.room;
    updateConfigureStore();
  }
  friendStore.inviteIds = friendStore.inviteIds?.filter((id) => id !== inviteId);
  delete friendStore.invites[inviteId];
  updateFriendStore();
};

export const getRecord = async (gameId: number) => {
  const { record } = await request<GetRecordQuery, GetRecordQueryVariables>(GetRecord, { gameId });
  store.record[gameId] = record;
  updateStore();
};

export const createComment = async (input: ScNewComment) => {
  const { createComment } = await request<CreateCommentMutation, CreateCommentMutationVariables>(CreateComment, {
    input,
  });
  store.comment[input.gameId] = {
    userIds: [
      ...(store.comment[input.gameId]?.userIds?.filter((id) => configure.user!.id !== id) || []),
      configure.user!.id,
    ],
    comments: {
      ...store.comment[input.gameId]?.comments,
      [configure.user!.id]: createComment,
    },
  };
  updateStore();
};

export const getMessages = async (targetId: number) => {
  const { messages } = await request<GetMessagesQuery, GetMessagesQueryVariables>(GetMessages, { input: { targetId } });
  friendStore.messageIds[targetId] = messages.map((e) => {
    friendStore.messages[e.id] = e;
    return e.id;
  });
  updateFriendStore();
};

export const readMessage = debounce(async (targetId: number) => {
  const { readMessage } = await request<ReadMessageMutation, ReadMessageMutationVariables>(ReadMessage, {
    input: { targetId },
  });
  friendStore.friends[targetId] = readMessage;
  updateFriendStore();
});

export const createMessage = async (targetId: number, body: string) => {
  const { createMessage } = await request<CreateMessageMutation, CreateMessageMutationVariables>(CreateMessage, {
    input: { targetId, body },
  });
  friendStore.messageIds[targetId] = [...(friendStore.messageIds[targetId] || []), createMessage.id];
  friendStore.messages[createMessage.id] = createMessage;
  updateFriendStore();
  playHintSound('sended');
};

export const favoriteGame = async (gameId: number, favorite: boolean) => {
  if (!configure.user) return gotoLogin();
  await request<FavoriteGameMutation, FavoriteGameMutationVariables>(FavoriteGame, {
    input: {
      gameId,
      favorite,
    },
  });
  if (favorite) {
    store.favoriteIds = [gameId, ...(store.favoriteIds || [])];
  } else {
    store.favoriteIds = store.favoriteIds?.filter((id) => id !== gameId);
  }
  updateStore();
};

export const sendSignal = async (targetId: number, signal: Signal) => {
  await request<SendSignalMutation, SendSignalMutationVariables>(SendSignal, {
    input: { targetId, json: JSON.stringify(signal) },
  });
};

export const subscribeEvent = () => {
  const subscription = subscribe<EventSubscription>(Event);
  (async function () {
    for await (const { event } of subscription) {
      const {
        newMessage,
        lobbyMessage,
        newGame,
        updateRoom,
        deleteRoom,
        newInvite,
        deleteInvite,
        applyFriend,
        acceptFriend,
        deleteFriend,
        updateUser,
        sendSignal,
        login,
        voiceSignal,
        favorite,
        deleteFavorite,
      } = event;

      if (lobbyMessage) {
        updateStore({
          lobbyMessage: [...store.lobbyMessage, lobbyMessage],
        });
      }

      if (newMessage) {
        friendStore.messages[newMessage.id] = newMessage;
        const userId = newMessage.userId === configure.user?.id ? newMessage.targetId : newMessage.userId;
        friendStore.messageIds[userId] = [...(friendStore.messageIds[userId] || []), newMessage.id];
        if (friendStore.friendChatState !== newMessage.userId) {
          const friend = friendStore.friends[newMessage.userId];
          if (friend) {
            friendStore.friends[newMessage.userId] = {
              ...friend,
              unreadMessageCount: friend.unreadMessageCount + 1,
            };
          }
          playSound('new_message');
        } else {
          documentVisible().then(() => readMessage(newMessage.userId));
          playHintSound('received');
        }
        updateFriendStore();
      }

      if (newGame) {
        store.games[newGame.id] = convertGame(newGame);
        if (isCurrentLang(newGame)) {
          updateStore({
            gameIds: [...(store.gameIds || []), newGame.id],
          });
        }
      }

      if (updateRoom) {
        const originRoom = store.rooms[updateRoom.id];
        if (originRoom) {
          Object.assign(originRoom, updateRoom);
          updateStore();
        }
        if (configure.user?.playing?.id === updateRoom.id) {
          configure.user.playing = updateRoom;
          updateConfigureStore();
        }
      }

      if (deleteRoom) {
        delete store.rooms[deleteRoom];
        updateStore({ roomIds: store.roomIds?.filter((id) => id !== deleteRoom) });
        if (configure.user && configure.user.playing?.id === deleteRoom) {
          if (configure.user.playing.host !== configure.user.id) {
            Toast.open('warning', i18n.get('tip.room.deleted'));
          }
          delete configure.user.playing;
          updateConfigureStore();
        }
      }

      if (newInvite) {
        friendStore.invites[newInvite.id] = newInvite;
        updateFriendStore({
          inviteIds: [...(friendStore.inviteIds || []), newInvite.id],
        });
        playSound('new_invite');
      }

      if (deleteInvite) {
        delete friendStore.invites[deleteInvite];
        updateFriendStore({ inviteIds: friendStore.inviteIds?.filter((id) => id !== deleteInvite) });
      }

      if (applyFriend) {
        friendStore.friends[applyFriend.user.id] = applyFriend;
        updateFriendStore({
          friendIds: [...new Set([...(friendStore.friendIds || []), applyFriend.user.id])],
        });
        playSound('apply_friend');
      }

      if (acceptFriend) {
        friendStore.friends[acceptFriend.user.id] = acceptFriend;
        updateFriendStore({
          friendIds: [...new Set([...(friendStore.friendIds || []), acceptFriend.user.id])],
        });
      }

      if (deleteFriend) {
        delete friendStore.friends[deleteFriend];
        friendStore.messageIds[deleteFriend]?.forEach((id) => delete friendStore.messages[id]);
        updateFriendStore({
          friendIds: friendStore.friendIds?.filter((id) => id !== deleteFriend),
          messageIds: { ...friendStore.messageIds, [deleteFriend]: undefined },
          draft: { ...friendStore.draft, [deleteFriend]: undefined },
        });
      }

      if (updateUser) {
        const friend = friendStore.friends[updateUser.id];
        if (friend) {
          friendStore.friends[updateUser.id] = { ...friend, user: updateUser };
          updateFriendStore();
        }
      }

      if (sendSignal) {
        dispatchGlobalEvent(globalEvents.SIGNAL, {
          userId: sendSignal.userId,
          signal: JSON.parse(sendSignal.json),
        });
      }

      if (voiceSignal) {
        dispatchGlobalEvent(globalEvents.VOICE_SIGNAL, {
          roomId: voiceSignal.roomId,
          signal: JSON.parse(voiceSignal.json),
        });
      }

      if (login && !mediaQuery.isPhone) {
        logout();
      }

      // 同步 favorite 列表，例如手机同步到电视
      if (favorite && !store.favoriteIds?.includes(favorite)) {
        store.favoriteIds = [favorite, ...(store.favoriteIds || [])];
        updateStore();
      }

      if (deleteFavorite && store.favoriteIds?.includes(deleteFavorite)) {
        store.favoriteIds = store.favoriteIds?.filter((id) => id !== deleteFavorite);
        updateStore();
      }
    }
  })();
  return subscription;
};
